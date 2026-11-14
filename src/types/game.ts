// src/types/game.ts

export type RockCard = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type CarrierColor = 'RED' | 'GREEN' | 'BLUE';

export type ChipColor = CarrierColor | 'RAINBOW';

export type GamePhase =
  | 'LOBBY'
  | 'PLAYING'
  | 'HALF_TIME' // 7라운드 종료 직후 중간 정산 및 자원 전량 재지급 알림
  | 'GAME_OVER'; // 14라운드 종료 후 최종 탈락자(최하위 2명) 판정

/**
 * 각 받침대(RED, GREEN, BLUE) 위에 쌓이는 개별 돌(숫자 타일) 엔티티
 */
export interface CarrierStone {
  id: string;
  value: RockCard;
  playerId: string;
  playerName: string;
  chipColor: ChipColor;
}

/**
 * 단일 색깔 받침대(Pillar)의 상태
 */
export interface SingleCarrierState {
  color: CarrierColor;
  stones: CarrierStone[];
  sum: number;
  lastChipColor: ChipColor | null;
}

export type CarriersMap = Record<CarrierColor, SingleCarrierState>;

export interface SubmittedCombo {
  playerId: string;
  playerName: string;
  card: RockCard;
  chip: ChipColor;
  targetCarrier: CarrierColor;
  round: number;
  causedExplosion: boolean;
}

export interface ExplosionSnapshot {
  id: string;
  carrierColor: CarrierColor;
  playerId: string;
  playerName: string;
  finalSum: number;
  penaltyAdded: number;
  round: number;
  explodedStones: CarrierStone[];
  timestamp: number;
}

/**
 * P2P 다국어 독립 렌더링을 위한 구조화된 이벤트 키
 * - Host는 완성된 한국어 문자열 대신 `eventKey`와 `params`를 전송하고,
 *   각 클라이언트(Host/Guest)가 자신의 로컬 언어('ko' | 'en' | 'ja')로 포맷팅한다.
 */
export type GameLogEventKey =
  | 'LOBBY_CREATED'
  | 'GAME_STARTED'
  | 'ROUND_STARTED'
  | 'SECOND_HALF_STARTED'
  | 'HALF_TIME_REACHED'
  | 'PASS_TURN'
  | 'SUBMIT_NORMAL'
  | 'SUBMIT_RAINBOW'
  | 'EXPLOSION'
  | 'BOT_TAKEOVER'
  | 'GAME_OVER';

export interface GameLogParams {
  playerId?: string;
  playerName?: string;
  card?: RockCard;
  chip?: ChipColor;
  targetCarrier?: CarrierColor;
  previousSum?: number;
  newSum?: number;
  penaltyAdded?: number;
  eliminatedPlayers?: {
    id: string;
    name: string;
    penaltyPoints: number;
  }[];
}

export interface GameLogEntry {
  id: string;
  round: number;
  timestamp: number;
  type:
    | 'SUBMIT'
    | 'PASS'
    | 'EXPLOSION'
    | 'ROUND_START'
    | 'HALF_TIME'
    | 'BOT_TAKEOVER'
    | 'GAME_OVER';
  eventKey?: GameLogEventKey;
  params?: GameLogParams;
  message: string;
  playerId?: string;
}

/**
 * Host가 관리하는 전체 플레이어 엔티티 (실제 카드 및 칩 배열 포함)
 */
export interface Player {
  id: string; // Host PeerID, Guest PeerID, 또는 Bot ID ('bot-1' 등)
  name: string;
  slotIndex: number; // 0 ~ 6 (7인 고정 슬롯)
  isHost: boolean;
  isBot: boolean;
  isConnected: boolean;
  cards: RockCard[]; // 보유 바위 카드 배열
  chips: ChipColor[]; // 보유 색깔 칩 배열
  penaltyPoints: number; // 누적 벌점
  hasPassedThisRound: boolean; // 현재 라운드에서 패스를 사용했는지 여부
  hasActedThisRound: boolean; // 현재 라운드에서 카드+칩 제출을 완료했는지 여부
  isEliminated: boolean; // 14라운드 종료 후 최하위 2명 탈락 여부
}

/**
 * Guest에게 브로드캐스트할 때 타 플레이어 및 봇의 실제 패를 마스킹한 뷰 모델
 */
export interface SanitizedOpponent {
  id: string;
  name: string;
  slotIndex: number;
  isHost: boolean;
  isBot: boolean;
  isConnected: boolean;
  remainingCards: number;
  remainingChips: number;
  penaltyPoints: number;
  hasPassedThisRound: boolean;
  hasActedThisRound: boolean;
  isEliminated: boolean;
}

export type SanitizedPlayerView = Player | SanitizedOpponent;

/**
 * Host 전용 권위 있는(Authoritative) 전체 게임 상태
 */
export interface HostGameState {
  roomCode: string;
  phase: GamePhase;
  round: number; // 1 ~ 14 (1~7 전반부, 8~14 후반부)
  half: 1 | 2; // 1: 전반부, 2: 후반부
  players: Player[]; // 항상 7인 슬롯 유지
  currentTurnPlayerId: string;
  roundStarterIndex: number; // 라운드 선플레이어 슬롯 인덱스 (0 ~ 6)
  turnQueue: string[]; // 현재 라운드에서 턴을 진행할 플레이어 ID 대기열
  passedQueue: string[]; // 패스를 선언하여 뒤로 밀린 플레이어 ID 목록
  carriers: CarriersMap; // RED, GREEN, BLUE 3개 받침대 상태
  lastSubmitted: SubmittedCombo | null;
  lastExplosion: ExplosionSnapshot | null;
  eliminatedPlayerIds: string[]; // 최종 탈락한 최하위 2명 ID
  logs: GameLogEntry[];
}

/**
 * 특정 수신자(Guest 또는 로컬 뷰어)에게만 본인의 실제 패를 노출하고
 * 나머지 6명의 패는 마스킹한 치팅 방지 상태 뷰 모델.
 */
export interface SanitizedGameState {
  roomCode: string;
  phase: GamePhase;
  round: number;
  half: 1 | 2;
  myPlayerId: string;
  myHand: {
    cards: RockCard[];
    chips: ChipColor[];
  };
  players: SanitizedOpponent[]; // 7인 전원의 공개 요약 정보 (개수만 포함)
  currentTurnPlayerId: string;
  roundStarterIndex: number;
  carriers: CarriersMap;
  lastSubmitted: SubmittedCombo | null;
  lastExplosion: ExplosionSnapshot | null;
  eliminatedPlayerIds: string[];
  logs: GameLogEntry[];
}

/**
 * 게임 엔진 리듀서 액션 타입
 */
export type GameAction =
  | {
      type: 'SUBMIT_COMBO';
      playerId: string;
      card: RockCard;
      chip: ChipColor;
      targetCarrier?: CarrierColor; // RAINBOW 칩 제출 시 지정한 대상 받침대 (RED | GREEN | BLUE)
    }
  | {
      type: 'PASS_TURN';
      playerId: string;
    }
  | {
      type: 'PROCEED_FROM_HALF_TIME';
    }
  | {
      type: 'REPLACE_WITH_BOT';
      playerId: string;
    }
  | {
      type: 'RESET_TO_LOBBY';
    };

/**
 * WebRTC DataChannel (PeerJS) JSON 프로토콜 메시지 유니온 타입
 */
export type PeerMessage =
  | {
      type: 'JOIN_REQUEST';
      senderId: string;
      playerName: string;
    }
  | {
      type: 'JOIN_REJECTED';
      reason: string;
    }
  | {
      type: 'STATE_SYNC';
      state: SanitizedGameState;
    }
  | {
      type: 'PLAYER_ACTION';
      senderId: string;
      action:
        | {
            type: 'SUBMIT_COMBO';
            card: RockCard;
            chip: ChipColor;
            targetCarrier?: CarrierColor;
          }
        | {
            type: 'PASS_TURN';
          };
    }
  | {
      type: 'ACTION_REJECTED';
      reason: string;
    }
  | {
      type: 'PING';
      timestamp: number;
    }
  | {
      type: 'PONG';
      timestamp: number;
    };
