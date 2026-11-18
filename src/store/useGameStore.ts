// src/store/useGameStore.ts
import { create } from 'zustand';
import type {
  CarrierColor,
  ChipColor,
  GameAction,
  GameOptions,
  HostGameState,
  RockCard,
  SanitizedGameState,
} from '../types/game';
import {
  addGuestToLobby,
  createLobbyState,
  DEFAULT_GAME_OPTIONS,
  gameReducer,
  resolveTargetCarrier,
  sanitizeGameStateForPlayer,
  startGame,
  validateAction,
} from '../engine/rules';
import { scheduleRoundAutomation } from '../engine/botAI';
import { playChipSelect } from '../utils/soundEffects';

export type NetworkRole = 'NONE' | 'HOST' | 'GUEST';

export type BroadcastSyncCallback = (hostState: HostGameState) => void;
export type GuestActionSender = (
  action:
    | {
        type: 'LOCK_IN_SELECTION';
        card: RockCard;
        chip: ChipColor;
      }
    | {
        type: 'EXECUTE_PLACEMENT';
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
  preferredOptions: GameOptions;

  // SELECTION 단계: 손패에서 선택한 카드 & 칩
  selectedCard: RockCard | null;
  selectedChip: ChipColor | null;

  // PLACEMENT 단계: RAINBOW 칩 제출자가 자신의 배치 차례에 선택한 대상 받침대
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
  updateGameOptions: (
    options: Partial<GameOptions>
  ) => { valid: boolean; reason?: string };
  proceedFromHalfTime: () => void;
  resetToLobby: () => void;
  dispatchHostAction: (
    action: GameAction
  ) => { valid: boolean; reason?: string };

  initGuestSession: (roomCode: string, guestId: string, guestName: string) => void;
  applyGuestStateSync: (sanitizedState: SanitizedGameState) => void;

  // 플레이어 인터랙션 액션
  lockInSelection: () => { valid: boolean; reason?: string };
  confirmPlacement: () => { valid: boolean; reason?: string };
  passTurn: () => { valid: boolean; reason?: string };
  leaveRoom: () => void;
}

const GAME_OPTIONS_STORAGE_KEY = 'heavy13_game_options';

function loadSavedGameOptions(): GameOptions {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_GAME_OPTIONS };
  }
  try {
    const raw = window.localStorage.getItem(GAME_OPTIONS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_GAME_OPTIONS };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      const mode = (parsed as { startPlayerMode?: unknown }).startPlayerMode;
      return {
        startPlayerMode: mode === 'RANDOM' ? 'RANDOM' : 'HOST',
      };
    }
  } catch {
    // localStorage 접근 불가 또는 파싱 실패 시 기본값 사용
  }
  return { ...DEFAULT_GAME_OPTIONS };
}

function saveGameOptions(options: GameOptions): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      GAME_OPTIONS_STORAGE_KEY,
      JSON.stringify(options)
    );
  } catch {
    // 저장 실패 시 무시
  }
}

let activeAutomationCleanup: (() => void) | null = null;
let broadcastCallback: BroadcastSyncCallback | null = null;
let guestActionSender: GuestActionSender | null = null;

function clearActiveAutomationTimer(): void {
  if (activeAutomationCleanup) {
    activeAutomationCleanup();
    activeAutomationCleanup = null;
  }
}

export const useGameStore = create<GameStoreState>((set, get) => {
  const commitHostState = (nextHostState: HostGameState): void => {
    clearActiveAutomationTimer();

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
      activeAutomationCleanup = scheduleRoundAutomation(
        nextHostState,
        (autoAction) => {
          get().dispatchHostAction(autoAction);
        }
      );
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
    preferredOptions: loadSavedGameOptions(),
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
      clearActiveAutomationTimer();
      const lobbyState = createLobbyState(
        roomCode,
        hostId,
        hostName,
        get().preferredOptions
      );
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

    updateGameOptions: (partialOptions) => {
      const { role, hostState, preferredOptions } = get();
      const nextOptions: GameOptions = {
        startPlayerMode:
          partialOptions.startPlayerMode === 'RANDOM'
            ? 'RANDOM'
            : partialOptions.startPlayerMode === 'HOST'
              ? 'HOST'
              : preferredOptions.startPlayerMode,
      };

      if (role === 'GUEST') {
        return { valid: false, reason: 'err_NO_HOST_PERMISSION' };
      }

      if (role === 'HOST') {
        if (!hostState || hostState.phase !== 'LOBBY') {
          return { valid: false, reason: 'err_OPTIONS_LOCKED_IN_GAME' };
        }
        saveGameOptions(nextOptions);
        set({ preferredOptions: nextOptions });
        return get().dispatchHostAction({
          type: 'UPDATE_GAME_OPTIONS',
          options: nextOptions,
        });
      }

      // 방 생성 전(role === 'NONE')에는 브라우저 기본 설정으로 저장
      saveGameOptions(nextOptions);
      set({ preferredOptions: nextOptions });
      return { valid: true };
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
        if (action.type === 'LOCK_IN_SELECTION') {
          const defaultTarget: CarrierColor =
            action.chip === 'RAINBOW' ? 'RED' : action.chip;
          set({
            selectedCard: null,
            selectedChip: null,
            selectedTargetCarrier: defaultTarget,
            lastActionError: null,
          });
        } else {
          set({
            selectedTargetCarrier: null,
            lastActionError: null,
          });
        }
      }
      commitHostState(nextState);
      return { valid: true };
    },

    initGuestSession: (roomCode, guestId, guestName) => {
      clearActiveAutomationTimer();
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

        const mySub = sanitizedState.submissions[sanitizedState.myPlayerId];
        const nextTargetCarrier: CarrierColor | null =
          sanitizedState.roundPhase === 'PLACEMENT' &&
          mySub?.chip === 'RAINBOW'
            ? prev.selectedTargetCarrier ?? 'RED'
            : prev.selectedTargetCarrier;

        return {
          viewState: sanitizedState,
          roomCode: sanitizedState.roomCode,
          isConnected: true,
          connectionError: null,
          selectedCard: stillHasCard ? prev.selectedCard : null,
          selectedChip: stillHasChip ? prev.selectedChip : null,
          selectedTargetCarrier: nextTargetCarrier,
        };
      });
    },

    /**
     * 1) SELECTION 단계: 선택한 바위 카드 1장과 색깔 칩 1개를 비밀 제출(Lock-in)
     */
    lockInSelection: () => {
      const { role, myPlayerId, selectedCard, selectedChip, viewState } = get();

      if (!viewState || viewState.phase !== 'PLAYING') {
        const reason = 'err_NOT_PLAYING';
        set({ lastActionError: reason });
        return { valid: false, reason };
      }

      if (viewState.roundPhase !== 'SELECTION') {
        const reason = 'err_NOT_SELECTION_PHASE';
        set({ lastActionError: reason });
        return { valid: false, reason };
      }

      const me = viewState.players.find((p) => p.id === myPlayerId);
      if (me?.hasSubmittedThisRound) {
        const reason = 'err_ALREADY_SUBMITTED';
        set({ lastActionError: reason });
        return { valid: false, reason };
      }

      if (selectedCard === null || selectedChip === null) {
        const reason = 'err_SELECT_BOTH_REQUIRED';
        set({ lastActionError: reason });
        return { valid: false, reason };
      }

      if (role === 'HOST') {
        return get().dispatchHostAction({
          type: 'LOCK_IN_SELECTION',
          playerId: myPlayerId,
          card: selectedCard,
          chip: selectedChip,
        });
      }

      if (role === 'GUEST') {
        if (!guestActionSender) {
          const reason = 'err_P2P_DISCONNECTED';
          set({ lastActionError: reason });
          return { valid: false, reason };
        }
        guestActionSender({
          type: 'LOCK_IN_SELECTION',
          card: selectedCard,
          chip: selectedChip,
        });
        const defaultTarget: CarrierColor =
          selectedChip === 'RAINBOW' ? 'RED' : selectedChip;
        set({
          selectedCard: null,
          selectedChip: null,
          selectedTargetCarrier: defaultTarget,
          lastActionError: null,
        });
        return { valid: true };
      }

      return { valid: false, reason: 'err_SESSION_NOT_INIT' };
    },

    /**
     * 2) PLACEMENT 단계: 내 배치 차례에 큐브를 받침대에 즉시 배치
     */
    confirmPlacement: () => {
      const { role, myPlayerId, selectedTargetCarrier, viewState } = get();

      if (
        !viewState ||
        viewState.phase !== 'PLAYING' ||
        viewState.roundPhase !== 'PLACEMENT'
      ) {
        const reason = 'err_NOT_YOUR_TURN';
        set({ lastActionError: reason });
        return { valid: false, reason };
      }

      if (viewState.currentTurnPlayerId !== myPlayerId) {
        const reason = 'err_NOT_YOUR_TURN';
        set({ lastActionError: reason });
        return { valid: false, reason };
      }

      const mySub = viewState.submissions[myPlayerId];
      if (!mySub || !mySub.chip) {
        const reason = 'err_PLAYER_NOT_FOUND';
        set({ lastActionError: reason });
        return { valid: false, reason };
      }

      const resolvedCarrier = resolveTargetCarrier(
        mySub.chip,
        selectedTargetCarrier ?? undefined
      );
      if (!resolvedCarrier) {
        const reason = 'err_RAINBOW_TARGET_REQUIRED';
        set({ lastActionError: reason });
        return { valid: false, reason };
      }

      if (role === 'HOST') {
        return get().dispatchHostAction({
          type: 'EXECUTE_PLACEMENT',
          playerId: myPlayerId,
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
          type: 'EXECUTE_PLACEMENT',
          targetCarrier: resolvedCarrier,
        });
        set({ lastActionError: null });
        return { valid: true };
      }

      return { valid: false, reason: 'err_SESSION_NOT_INIT' };
    },

    /**
     * 3) PLACEMENT 단계: 내 배치 차례에 라운드당 1회 패스 선언 (역순 후배치)
     */
    passTurn: () => {
      const { role, myPlayerId, viewState } = get();
      if (
        !viewState ||
        viewState.phase !== 'PLAYING' ||
        viewState.roundPhase !== 'PLACEMENT'
      ) {
        const reason = 'err_NOT_YOUR_TURN';
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
      clearActiveAutomationTimer();
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
