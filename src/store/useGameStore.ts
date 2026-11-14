// src/store/useGameStore.ts
import { create } from 'zustand';
import type {
  CarrierColor,
  ChipColor,
  GameAction,
  HostGameState,
  RockCard,
  SanitizedGameState,
} from '../types/game';
import {
  addGuestToLobby,
  createLobbyState,
  gameReducer,
  resolveTargetCarrier,
  sanitizeGameStateForPlayer,
  startGame,
  validateAction,
} from '../engine/rules';
import { scheduleBotTurn } from '../engine/botAI';
import { playChipSelect } from '../utils/soundEffects';

export type NetworkRole = 'NONE' | 'HOST' | 'GUEST';

export type BroadcastSyncCallback = (hostState: HostGameState) => void;
export type GuestActionSender = (
  action:
    | {
        type: 'SUBMIT_COMBO';
        card: RockCard;
        chip: ChipColor;
        targetCarrier?: CarrierColor;
      }
    | { type: 'PASS_TURN' }
) => void;

export interface GameStoreState {
  role: NetworkRole;
  myPlayerId: string;
  myPlayerName: string;
  roomCode: string;
  isConnected: boolean;
  connectionError: string | null;
  lastActionError: string | null;

  hostState: HostGameState | null;
  viewState: SanitizedGameState | null;

  selectedCard: RockCard | null;
  selectedChip: ChipColor | null;
  selectedTargetCarrier: CarrierColor | null;

  registerBroadcastCallback: (cb: BroadcastSyncCallback | null) => void;
  registerGuestActionSender: (sender: GuestActionSender | null) => void;

  setConnectionStatus: (isConnected: boolean, error?: string | null) => void;
  setLastActionError: (error: string | null) => void;
  selectCard: (card: RockCard | null) => void;
  selectChip: (chip: ChipColor | null) => void;
  selectTargetCarrier: (carrier: CarrierColor | null) => void;

  initHostLobby: (roomCode: string, hostId: string, hostName: string) => void;
  handleGuestJoinRequest: (
    guestId: string,
    guestName: string
  ) => { joined: boolean; reason?: string };
  handleGuestDisconnect: (guestId: string) => void;
  startHostGame: () => void;
  proceedFromHalfTime: () => void;
  resetToLobby: () => void;
  dispatchHostAction: (
    action: GameAction
  ) => { valid: boolean; reason?: string };

  initGuestSession: (roomCode: string, guestId: string, guestName: string) => void;
  applyGuestStateSync: (sanitizedState: SanitizedGameState) => void;

  submitSelectedCombo: () => { valid: boolean; reason?: string };
  passTurn: () => { valid: boolean; reason?: string };
  leaveRoom: () => void;
}

let activeBotCleanup: (() => void) | null = null;
let broadcastCallback: BroadcastSyncCallback | null = null;
let guestActionSender: GuestActionSender | null = null;

function clearActiveBotTimer(): void {
  if (activeBotCleanup) {
    activeBotCleanup();
    activeBotCleanup = null;
  }
}

export const useGameStore = create<GameStoreState>((set, get) => {
  const commitHostState = (nextHostState: HostGameState): void => {
    clearActiveBotTimer();

    const { myPlayerId } = get();
    const hostView = sanitizeGameStateForPlayer(nextHostState, myPlayerId);

    set({
      hostState: nextHostState,
      viewState: hostView,
      roomCode: nextHostState.roomCode,
    });

    if (broadcastCallback) {
      broadcastCallback(nextHostState);
    }

    if (nextHostState.phase === 'PLAYING') {
      activeBotCleanup = scheduleBotTurn(nextHostState, (botAction) => {
        get().dispatchHostAction(botAction);
      });
    }
  };

  return {
    role: 'NONE',
    myPlayerId: '',
    myPlayerName: '',
    roomCode: '',
    isConnected: false,
    connectionError: null,
    lastActionError: null,
    hostState: null,
    viewState: null,
    selectedCard: null,
    selectedChip: null,
    selectedTargetCarrier: null,

    registerBroadcastCallback: (cb) => {
      broadcastCallback = cb;
    },

    registerGuestActionSender: (sender) => {
      guestActionSender = sender;
    },

    setConnectionStatus: (isConnected, error = null) => {
      set({ isConnected, connectionError: error });
    },

    setLastActionError: (error) => {
      set({ lastActionError: error });
    },

    selectCard: (card) => {
      if (card !== null) {
        playChipSelect();
      }
      set({ selectedCard: card, lastActionError: null });
    },

    selectChip: (chip) => {
      if (chip !== null) {
        playChipSelect();
      }
      set((prev) => ({
        selectedChip: chip,
        selectedTargetCarrier:
          chip === 'RAINBOW' ? prev.selectedTargetCarrier ?? 'RED' : chip,
        lastActionError: null,
      }));
    },

    selectTargetCarrier: (carrier) => {
      if (carrier !== null) {
        playChipSelect();
      }
      set({ selectedTargetCarrier: carrier, lastActionError: null });
    },

    initHostLobby: (roomCode, hostId, hostName) => {
      clearActiveBotTimer();
      const lobbyState = createLobbyState(roomCode, hostId, hostName);
      const hostView = sanitizeGameStateForPlayer(lobbyState, hostId);

      set({
        role: 'HOST',
        myPlayerId: hostId,
        myPlayerName: hostName.trim() || 'Host',
        roomCode,
        isConnected: true,
        connectionError: null,
        lastActionError: null,
        hostState: lobbyState,
        viewState: hostView,
        selectedCard: null,
        selectedChip: null,
        selectedTargetCarrier: null,
      });

      if (broadcastCallback) {
        broadcastCallback(lobbyState);
      }
    },

    handleGuestJoinRequest: (guestId, guestName) => {
      const { hostState, role } = get();
      if (role !== 'HOST' || !hostState) {
        return { joined: false, reason: 'err_NO_HOST_SESSION' };
      }

      const result = addGuestToLobby(hostState, guestId, guestName);
      if (result.joined) {
        commitHostState(result.state);
      }
      return { joined: result.joined, reason: result.reason };
    },

    handleGuestDisconnect: (guestId) => {
      const { hostState, role } = get();
      if (role !== 'HOST' || !hostState) return;

      const target = hostState.players.find((p) => p.id === guestId);
      if (!target || target.isBot) return;

      if (hostState.phase === 'LOBBY') {
        const restoredPlayers = hostState.players.map((p) =>
          p.id === guestId
            ? {
                ...p,
                id: `bot-${p.slotIndex}`,
                name: `AI Bot ${p.slotIndex}`,
                isBot: true,
                isConnected: true,
              }
            : p
        );
        commitHostState({
          ...hostState,
          players: restoredPlayers,
        });
        return;
      }

      const nextState = gameReducer(hostState, {
        type: 'REPLACE_WITH_BOT',
        playerId: guestId,
      });
      commitHostState(nextState);
    },

    startHostGame: () => {
      const { hostState, role } = get();
      if (role !== 'HOST' || !hostState) return;

      const startedState = startGame(hostState);
      set({
        selectedCard: null,
        selectedChip: null,
        selectedTargetCarrier: null,
        lastActionError: null,
      });
      commitHostState(startedState);
    },

    proceedFromHalfTime: () => {
      const { role } = get();
      if (role !== 'HOST') return;
      get().dispatchHostAction({ type: 'PROCEED_FROM_HALF_TIME' });
    },

    resetToLobby: () => {
      const { role } = get();
      if (role !== 'HOST') return;
      set({
        selectedCard: null,
        selectedChip: null,
        selectedTargetCarrier: null,
        lastActionError: null,
      });
      get().dispatchHostAction({ type: 'RESET_TO_LOBBY' });
    },

    dispatchHostAction: (action) => {
      const { hostState, role, myPlayerId } = get();
      if (role !== 'HOST' || !hostState) {
        return { valid: false, reason: 'err_NO_HOST_PERMISSION' };
      }

      const validation = validateAction(hostState, action);
      if (!validation.valid) {
        if ('playerId' in action && action.playerId === myPlayerId) {
          set({ lastActionError: validation.reason ?? 'err_UNKNOWN_ACTION' });
        }
        return validation;
      }

      const nextState = gameReducer(hostState, action);
      if ('playerId' in action && action.playerId === myPlayerId) {
        set({
          selectedCard: null,
          selectedChip: null,
          selectedTargetCarrier: null,
          lastActionError: null,
        });
      }
      commitHostState(nextState);
      return { valid: true };
    },

    initGuestSession: (roomCode, guestId, guestName) => {
      clearActiveBotTimer();
      set({
        role: 'GUEST',
        myPlayerId: guestId,
        myPlayerName: guestName.trim() || 'Guest',
        roomCode,
        isConnected: false,
        connectionError: null,
        lastActionError: null,
        hostState: null,
        viewState: null,
        selectedCard: null,
        selectedChip: null,
        selectedTargetCarrier: null,
      });
    },

    applyGuestStateSync: (sanitizedState) => {
      set((prev) => {
        const stillHasCard =
          prev.selectedCard !== null &&
          sanitizedState.myHand.cards.includes(prev.selectedCard);
        const stillHasChip =
          prev.selectedChip !== null &&
          sanitizedState.myHand.chips.includes(prev.selectedChip);

        return {
          viewState: sanitizedState,
          roomCode: sanitizedState.roomCode,
          isConnected: true,
          connectionError: null,
          selectedCard: stillHasCard ? prev.selectedCard : null,
          selectedChip: stillHasChip ? prev.selectedChip : null,
          selectedTargetCarrier: stillHasChip ? prev.selectedTargetCarrier : null,
        };
      });
    },

    submitSelectedCombo: () => {
      const {
        role,
        myPlayerId,
        selectedCard,
        selectedChip,
        selectedTargetCarrier,
        viewState,
      } = get();

      if (!viewState || viewState.phase !== 'PLAYING') {
        const reason = 'err_NOT_PLAYING';
        set({ lastActionError: reason });
        return { valid: false, reason };
      }

      if (viewState.currentTurnPlayerId !== myPlayerId) {
        const reason = 'err_NOT_YOUR_TURN';
        set({ lastActionError: reason });
        return { valid: false, reason };
      }

      if (selectedCard === null || selectedChip === null) {
        const reason = 'err_SELECT_BOTH_REQUIRED';
        set({ lastActionError: reason });
        return { valid: false, reason };
      }

      const resolvedCarrier = resolveTargetCarrier(
        selectedChip,
        selectedTargetCarrier ?? undefined
      );
      if (!resolvedCarrier) {
        const reason = 'err_RAINBOW_TARGET_REQUIRED';
        set({ lastActionError: reason });
        return { valid: false, reason };
      }

      if (role === 'HOST') {
        return get().dispatchHostAction({
          type: 'SUBMIT_COMBO',
          playerId: myPlayerId,
          card: selectedCard,
          chip: selectedChip,
          targetCarrier: resolvedCarrier,
        });
      }

      if (role === 'GUEST') {
        if (!guestActionSender) {
          const reason = 'err_P2P_DISCONNECTED';
          set({ lastActionError: reason });
          return { valid: false, reason };
        }
        guestActionSender({
          type: 'SUBMIT_COMBO',
          card: selectedCard,
          chip: selectedChip,
          targetCarrier: resolvedCarrier,
        });
        set({
          selectedCard: null,
          selectedChip: null,
          selectedTargetCarrier: null,
          lastActionError: null,
        });
        return { valid: true };
      }

      return { valid: false, reason: 'err_SESSION_NOT_INIT' };
    },

    passTurn: () => {
      const { role, myPlayerId, viewState } = get();
      if (!viewState || viewState.phase !== 'PLAYING') {
        const reason = 'err_NOT_PLAYING';
        set({ lastActionError: reason });
        return { valid: false, reason };
      }

      if (viewState.currentTurnPlayerId !== myPlayerId) {
        const reason = 'err_NOT_YOUR_TURN';
        set({ lastActionError: reason });
        return { valid: false, reason };
      }

      if (role === 'HOST') {
        return get().dispatchHostAction({
          type: 'PASS_TURN',
          playerId: myPlayerId,
        });
      }

      if (role === 'GUEST') {
        if (!guestActionSender) {
          const reason = 'err_P2P_DISCONNECTED';
          set({ lastActionError: reason });
          return { valid: false, reason };
        }
        guestActionSender({ type: 'PASS_TURN' });
        set({ lastActionError: null });
        return { valid: true };
      }

      return { valid: false, reason: 'err_SESSION_NOT_INIT' };
    },

    leaveRoom: () => {
      clearActiveBotTimer();
      set({
        role: 'NONE',
        myPlayerId: '',
        myPlayerName: '',
        roomCode: '',
        isConnected: false,
        connectionError: null,
        lastActionError: null,
        hostState: null,
        viewState: null,
        selectedCard: null,
        selectedChip: null,
        selectedTargetCarrier: null,
      });
    },
  };
});
