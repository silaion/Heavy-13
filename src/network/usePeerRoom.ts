// src/network/usePeerRoom.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import type {
  CarrierColor,
  ChipColor,
  HostGameState,
  PeerMessage,
  RockCard,
  SanitizedGameState,
} from '../types/game';
import { sanitizeGameStateForPlayer } from '../engine/rules';
import { useGameStore } from '../store/useGameStore';

const PEER_PREFIX = 'heavy13-room-';

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidRockCard(value: unknown): value is RockCard {
  return (
    value === 0 ||
    value === 1 ||
    value === 2 ||
    value === 3 ||
    value === 4 ||
    value === 5 ||
    value === 6
  );
}

function isValidCarrierColor(value: unknown): value is CarrierColor {
  return value === 'RED' || value === 'GREEN' || value === 'BLUE';
}

function isValidChipColor(value: unknown): value is ChipColor {
  return isValidCarrierColor(value) || value === 'RAINBOW';
}

/**
 * WebRTC DataChannel을 통해 수신된 unknown 페이로드를 런타임 검증하여
 * 타입 안전한 `PeerMessage`로 좁히는(Type Guard) 함수 (`any` 사용 금지)
 */
export function isPeerMessage(data: unknown): data is PeerMessage {
  if (!isObjectRecord(data) || typeof data.type !== 'string') {
    return false;
  }

  switch (data.type) {
    case 'JOIN_REQUEST':
      return (
        typeof data.senderId === 'string' && typeof data.playerName === 'string'
      );

    case 'JOIN_REJECTED':
    case 'ACTION_REJECTED':
      return typeof data.reason === 'string';

    case 'STATE_SYNC':
      return (
        isObjectRecord(data.state) &&
        typeof data.state.roomCode === 'string' &&
        typeof data.state.phase === 'string' &&
        Array.isArray(data.state.players) &&
        isObjectRecord(data.state.carriers)
      );

    case 'PLAYER_ACTION': {
      if (typeof data.senderId !== 'string' || !isObjectRecord(data.action)) {
        return false;
      }
      if (data.action.type === 'PASS_TURN') {
        return true;
      }
      if (data.action.type === 'SUBMIT_COMBO') {
        const hasValidTarget =
          data.action.targetCarrier === undefined ||
          isValidCarrierColor(data.action.targetCarrier);
        return (
          isValidRockCard(data.action.card) &&
          isValidChipColor(data.action.chip) &&
          hasValidTarget
        );
      }
      return false;
    }

    case 'PING':
    case 'PONG':
      return typeof data.timestamp === 'number';

    default:
      return false;
  }
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function toHostPeerId(roomCode: string): string {
  return `${PEER_PREFIX}${roomCode.trim().toUpperCase()}`;
}

export interface UsePeerRoomReturn {
  isInitializing: boolean;
  createRoomAsHost: (hostName: string, customRoomCode?: string) => void;
  joinRoomAsGuest: (roomCode: string, guestName: string) => void;
  disconnectRoom: () => void;
}

export function usePeerRoom(): UsePeerRoomReturn {
  const [isInitializing, setIsInitializing] = useState<boolean>(false);

  const peerRef = useRef<Peer | null>(null);
  const hostConnectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const guestConnectionRef = useRef<DataConnection | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const phase = useGameStore((s) => s.viewState?.phase ?? null);
  const registerBroadcastCallback = useGameStore(
    (s) => s.registerBroadcastCallback
  );
  const registerGuestActionSender = useGameStore(
    (s) => s.registerGuestActionSender
  );

  // 모바일 브라우저 화면 꺼짐 방지 (Screen Wake Lock API)
  const acquireWakeLock = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return;
    }
    try {
      if (wakeLockRef.current !== null) return;
      const sentinel = await navigator.wakeLock.request('screen');
      wakeLockRef.current = sentinel;
      sentinel.addEventListener('release', () => {
        wakeLockRef.current = null;
      });
    } catch {
      // 권한 거부 시 무시
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current !== null) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // 무시
      } finally {
        wakeLockRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    const isGameActive =
      phase === 'LOBBY' || phase === 'PLAYING' || phase === 'HALF_TIME';

    if (isGameActive) {
      void acquireWakeLock();
    } else {
      void releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isGameActive) {
        void acquireWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [phase, acquireWakeLock, releaseWakeLock]);

  const cleanupPeerResources = useCallback(() => {
    for (const conn of hostConnectionsRef.current.values()) {
      try {
        conn.close();
      } catch {
        // 무시
      }
    }
    hostConnectionsRef.current.clear();

    if (guestConnectionRef.current) {
      try {
        guestConnectionRef.current.close();
      } catch {
        // 무시
      }
      guestConnectionRef.current = null;
    }

    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch {
        // 무시
      }
      peerRef.current = null;
    }
  }, []);

  const broadcastSanitizedStateToGuests = useCallback(
    (hostState: HostGameState) => {
      for (const [guestId, conn] of hostConnectionsRef.current.entries()) {
        if (!conn.open) continue;
        const sanitizedForGuest: SanitizedGameState =
          sanitizeGameStateForPlayer(hostState, guestId);
        const packet: PeerMessage = {
          type: 'STATE_SYNC',
          state: sanitizedForGuest,
        };
        try {
          conn.send(packet);
        } catch {
          // 전송 실패 시 close/error 이벤트에서 봇 핫스왑 처리됨
        }
      }
    },
    []
  );

  const sendActionFromGuest = useCallback(
    (
      action:
        | {
            type: 'SUBMIT_COMBO';
            card: RockCard;
            chip: ChipColor;
            targetCarrier?: CarrierColor;
          }
        | { type: 'PASS_TURN' }
    ) => {
      const conn = guestConnectionRef.current;
      const myPlayerId = useGameStore.getState().myPlayerId;
      if (!conn || !conn.open) {
        useGameStore
          .getState()
          .setLastActionError('err_P2P_DISCONNECTED');
        return;
      }

      const packet: PeerMessage = {
        type: 'PLAYER_ACTION',
        senderId: myPlayerId,
        action,
      };
      conn.send(packet);
    },
    []
  );

  useEffect(() => {
    registerBroadcastCallback(broadcastSanitizedStateToGuests);
    registerGuestActionSender(sendActionFromGuest);

    return () => {
      registerBroadcastCallback(null);
      registerGuestActionSender(null);
      cleanupPeerResources();
      void releaseWakeLock();
    };
  }, [
    registerBroadcastCallback,
    registerGuestActionSender,
    broadcastSanitizedStateToGuests,
    sendActionFromGuest,
    cleanupPeerResources,
    releaseWakeLock,
  ]);

  const createRoomAsHost = useCallback(
    (hostName: string, customRoomCode?: string) => {
      cleanupPeerResources();
      setIsInitializing(true);

      const roomCode = (
        customRoomCode?.trim() || generateRoomCode()
      ).toUpperCase();
      const hostPeerId = toHostPeerId(roomCode);

      const peer = new Peer(hostPeerId);
      peerRef.current = peer;

      peer.on('open', (id) => {
        setIsInitializing(false);
        useGameStore.getState().initHostLobby(roomCode, id, hostName);
      });

      peer.on('connection', (conn) => {
        const remotePeerId = conn.peer;

        conn.on('open', () => {
          hostConnectionsRef.current.set(remotePeerId, conn);
        });

        conn.on('data', (rawData: unknown) => {
          if (!isPeerMessage(rawData)) return;

          const store = useGameStore.getState();

          if (rawData.type === 'PING') {
            const pong: PeerMessage = {
              type: 'PONG',
              timestamp: rawData.timestamp,
            };
            conn.send(pong);
            return;
          }

          if (rawData.type === 'JOIN_REQUEST') {
            const verifiedSenderId = remotePeerId;
            hostConnectionsRef.current.set(verifiedSenderId, conn);

            const joinResult = store.handleGuestJoinRequest(
              verifiedSenderId,
              rawData.playerName
            );

            if (!joinResult.joined) {
              const rejectMsg: PeerMessage = {
                type: 'JOIN_REJECTED',
                reason: joinResult.reason ?? 'err_ALREADY_PLAYING',
              };
              conn.send(rejectMsg);
              hostConnectionsRef.current.delete(verifiedSenderId);
              setTimeout(() => {
                try {
                  conn.close();
                } catch {
                  // 무시
                }
              }, 200);
              return;
            }

            const latestHostState = useGameStore.getState().hostState;
            if (latestHostState) {
              const sanitized = sanitizeGameStateForPlayer(
                latestHostState,
                verifiedSenderId
              );
              const syncMsg: PeerMessage = {
                type: 'STATE_SYNC',
                state: sanitized,
              };
              conn.send(syncMsg);
            }
            return;
          }

          if (rawData.type === 'PLAYER_ACTION') {
            const verifiedSenderId = remotePeerId;
            if (rawData.senderId !== verifiedSenderId) {
              const rejectMsg: PeerMessage = {
                type: 'ACTION_REJECTED',
                reason: 'err_SENDER_MISMATCH',
              };
              conn.send(rejectMsg);
              return;
            }

            const currentHostState = store.hostState;
            if (
              !currentHostState ||
              currentHostState.currentTurnPlayerId !== verifiedSenderId
            ) {
              const rejectMsg: PeerMessage = {
                type: 'ACTION_REJECTED',
                reason: 'err_NOT_YOUR_TURN',
              };
              conn.send(rejectMsg);
              return;
            }

            const result =
              rawData.action.type === 'PASS_TURN'
                ? store.dispatchHostAction({
                    type: 'PASS_TURN',
                    playerId: verifiedSenderId,
                  })
                : store.dispatchHostAction({
                    type: 'SUBMIT_COMBO',
                    playerId: verifiedSenderId,
                    card: rawData.action.card,
                    chip: rawData.action.chip,
                    targetCarrier: rawData.action.targetCarrier,
                  });

            if (!result.valid) {
              const rejectMsg: PeerMessage = {
                type: 'ACTION_REJECTED',
                reason: result.reason ?? 'err_UNKNOWN_ACTION',
              };
              conn.send(rejectMsg);
            }
          }
        });

        const handleRemoteDrop = () => {
          if (hostConnectionsRef.current.has(remotePeerId)) {
            hostConnectionsRef.current.delete(remotePeerId);
          }
          useGameStore.getState().handleGuestDisconnect(remotePeerId);
        };

        conn.on('close', handleRemoteDrop);
        conn.on('error', handleRemoteDrop);
      });

      peer.on('error', (err) => {
        setIsInitializing(false);
        useGameStore
          .getState()
          .setConnectionStatus(
            false,
            `err_HOST_PEER_ERROR:${err.message || err.type}`
          );
      });
    },
    [cleanupPeerResources]
  );

  const joinRoomAsGuest = useCallback(
    (roomCode: string, guestName: string) => {
      cleanupPeerResources();
      setIsInitializing(true);

      const normalizedCode = roomCode.trim().toUpperCase();
      const targetHostPeerId = toHostPeerId(normalizedCode);

      const peer = new Peer();
      peerRef.current = peer;

      peer.on('open', (myPeerId) => {
        useGameStore
          .getState()
          .initGuestSession(normalizedCode, myPeerId, guestName);

        const conn = peer.connect(targetHostPeerId, { reliable: true });
        guestConnectionRef.current = conn;

        conn.on('open', () => {
          setIsInitializing(false);
          useGameStore.getState().setConnectionStatus(true, null);

          const joinPacket: PeerMessage = {
            type: 'JOIN_REQUEST',
            senderId: myPeerId,
            playerName: guestName.trim() || 'Guest',
          };
          conn.send(joinPacket);
        });

        conn.on('data', (rawData: unknown) => {
          if (!isPeerMessage(rawData)) return;

          if (rawData.type === 'STATE_SYNC') {
            useGameStore.getState().applyGuestStateSync(rawData.state);
            return;
          }

          if (rawData.type === 'JOIN_REJECTED') {
            setIsInitializing(false);
            useGameStore
              .getState()
              .setConnectionStatus(false, rawData.reason);
            cleanupPeerResources();
            return;
          }

          if (rawData.type === 'ACTION_REJECTED') {
            useGameStore.getState().setLastActionError(rawData.reason);
          }
        });

        const handleHostLost = () => {
          setIsInitializing(false);
          useGameStore
            .getState()
            .setConnectionStatus(false, 'err_HOST_LOST');
        };

        conn.on('close', handleHostLost);
        conn.on('error', handleHostLost);
      });

      peer.on('error', (err) => {
        setIsInitializing(false);
        useGameStore
          .getState()
          .setConnectionStatus(
            false,
            `err_JOIN_FAILED:${normalizedCode}:${err.type}`
          );
      });
    },
    [cleanupPeerResources]
  );

  const disconnectRoom = useCallback(() => {
    cleanupPeerResources();
    void releaseWakeLock();
    setIsInitializing(false);
    useGameStore.getState().leaveRoom();
  }, [cleanupPeerResources, releaseWakeLock]);

  return {
    isInitializing,
    createRoomAsHost,
    joinRoomAsGuest,
    disconnectRoom,
  };
}
