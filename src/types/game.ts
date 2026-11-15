// src/types/game.ts

export type RockCard = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type CarrierColor = 'RED' | 'GREEN' | 'BLUE';

export type ChipColor = CarrierColor | 'RAINBOW';

export type GamePhase =
  | 'LOBBY'
  | 'PLAYING'
  | 'HALF_TIME' // 7라운드 종료 직후 중간 정산 및 손패 재지급 알림
  | 'GAME_OVER'; // 14라운드 종료 후 최종 탈락자(최하위 2명) 판정

/**
 * 매 라운드 내부 진행 페이즈 (원작 규칙 기반 단계별 상태 기계)
 * 1. SELECTION: 7명 전원 동시에 칩 1개 + 바위 카드 1장 비밀 선택 및 제출(Lock-in)
 * 2. REVEAL_CHIPS: 7명 전원의 제출 완료 후 색깔 칩만 먼저 일제히 공개 (카드는 비공개)
 * 3. REVEAL_CARDS: 바위 카드 숫자까지 모두 공개 및 우선순위 규칙에 따른 배치 순서(placementQueue) 확정
 * 4. PLACEMENT: 확정된 순서대로 한 명씩 받침대에 배치하거나 패스(LIFO 역순 후배치) 진행
 * 5. ROUND_END: 7명 전원 배치 완료 및 다음 라운드 선 플레이어(마지막 벌점 획득자) 갱신
 */
export type RoundPhase =
  | 'SELECTION'
  | 'REVEAL_CHIPS'
  | 'REVEAL_CARDS'
  | 'PLACEMENT'
  | 'ROUND_END';

/**
 * 각 받침대(RED, GREEN, BLUE) 위에 쌓이는 개별 돌(바위 큐브) 엔티티
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

/**
 * Host가 관리하는 플레이어별 라운드 제출 원본 데이터
 */
export interface PlayerSubmission {
  playerId: string;
  playerName: string;
  chip: ChipColor;
  card: RockCard;
}

/**
 * Guest 및 UI에 노출되는 치팅 방지 마스킹 제출 상태
 * - SELECTION: `hasSubmitted: true`만 공개되고 `chip`, `card`는 모두 `null` (단, 본인에게는 본인 선택값 표시 가능)
 * - REVEAL_CHIPS: `chip` 공개, `card`는 `null` (본인 제외)
 * - REVEAL_CARDS / PLACEMENT / ROUND_END: `chip`과 `card` 모두 공개
 */
export interface SanitizedSubmission {
  playerId: string;
  playerName: string;
  hasSubmitted: boolean;
  chip: ChipColor | null;
  card: RockCard | null;
}

/**
 * 우선순위 정렬이 완료된 이번 라운드 큐브 배치 대기열 항목
 */
export interface PlacementQueueItem {
  playerId: string;
  playerName: string;
  slotIndex: number;
  chip: ChipColor;
  card: RockCard;
  priorityOrder: number; // 1 ~ 7 (1차 정렬 순위)
  status: 'PENDING' | 'PASSED' | 'PLACED';
  placedCarrier?: CarrierColor;
}

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
  finalSum: number; // 폭발을 유발한 합계 (>= 13)
  newBaseSum: number; // 기존 돌 수거 후 새로 남은 큐브 1개의 숫자 값
  penaltyAdded: number; // 수거된 기존 바위 큐브 개수만큼의 벌점
  round: number;
  explodedStones: CarrierStone[]; // 폭발 연출용 (기존 돌들 + 방금 올린 돌)
  collectedCount: number; // 수거된 기존 돌 개수
  remainingStone: CarrierStone; // 폭발 후 받침대 1층 첫 칸에 홀로 남은 신규 큐브
  timestamp: number;
}

/**
 * P2P 다국어 독립 렌더링을 위한 구조화된 이벤트 키
 */
export type GameLogEventKey =
  | 'LOBBY_CREATED'
  | 'GAME_STARTED'
  | 'ROUND_STARTED'
  | 'SECOND_HALF_STARTED'
  | 'HALF_TIME_REACHED'
  | 'PLAYER_LOCKED_IN'
  | 'CHIPS_REVEALED'
  | 'CARDS_REVEALED'
  | 'PASS_TURN'
  | 'SUBMIT_NORMAL'
  | 'SUBMIT_RAINBOW'
  | 'EXPLOSION'
  | 'STARTER_UPDATED'
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
  newBaseSum?: number;
  penaltyAdded?: number;
  collectedCount?: number;
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
  id: string;
  name: string;
  slotIndex: number; // 0 ~ 6 (7인 고정 슬롯)
  isHost: boolean;
  isBot: boolean;
  isConnected: boolean;
  cards: RockCard[]; // 보유 바위 카드 배열
  chips: ChipColor[]; // 보유 색깔 칩 배열
  penaltyPoints: number; // 누적 벌점
  hasSubmittedThisRound: boolean; // SELECTION 단계에서 카드+칩 선택 제출 완료 여부
  hasPassedThisRound: boolean; // PLACEMENT 단계에서 패스를 사용했는지 여부
  hasActedThisRound: boolean; // PLACEMENT 단계에서 받침대 배치를 완료했는지 여부
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
  hasSubmittedThisRound: boolean;
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
  roundPhase: RoundPhase;
  round: number; // 1 ~ 14 (1~7 전반부, 8~14 후반부)
  half: 1 | 2;
  players: Player[]; // 항상 7인 슬롯 유지
  startPlayerId: string; // 현재 라운드 선 플레이어 ID
  roundStarterIndex: number; // 선 플레이어 슬롯 인덱스 (0 ~ 6)
  lastPenaltyPlayerIdInRound: string | null; // 이번 라운드에서 가장 마지막으로 벌점을 받은 플레이어 ID
  submissions: Record<string, PlayerSubmission>; // SELECTION 단계에서 제출된 7인의 카드+칩 원본
  placementQueue: PlacementQueueItem[]; // 우선순위 정렬된 이번 라운드 전체 배치 목록
  currentTurnPlayerId: string; // PLACEMENT 단계에서 현재 배치/패스를 결정할 차례인 플레이어 ID
  turnQueue: string[]; // 아직 패스하지 않은 1차 배치 대기 플레이어 ID 목록
  passedQueue: string[]; // 패스를 선언하여 뒤로 밀린 플레이어 ID 목록 (LIFO 역순 배치)
  carriers: CarriersMap; // RED, GREEN, BLUE 3개 받침대 상태
  lastSubmitted: SubmittedCombo | null;
  lastExplosion: ExplosionSnapshot | null;
  eliminatedPlayerIds: string[]; // 최종 탈락한 최하위 2명 ID
  logs: GameLogEntry[];
}

/**
 * 특정 수신자(Guest 또는 로컬 뷰어)에게만 본인의 실제 패를 노출하고
 * 나머지 6명의 패와 미공개 제출 카드를 마스킹한 치팅 방지 상태 뷰 모델.
 */
export interface SanitizedGameState {
  roomCode: string;
  phase: GamePhase;
  roundPhase: RoundPhase;
  round: number;
  half: 1 | 2;
  myPlayerId: string;
  myHand: {
    cards: RockCard[];
    chips: ChipColor[];
  };
  players: SanitizedOpponent[];
  startPlayerId: string;
  roundStarterIndex: number;
  submissions: Record<string, SanitizedSubmission>;
  placementQueue: PlacementQueueItem[]; // REVEAL_CARDS 이후에만 공개되며, 이전에는 빈 배열로 마스킹
  currentTurnPlayerId: string;
  turnQueue: string[];
  passedQueue: string[];
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
      type: 'LOCK_IN_SELECTION';
      playerId: string;
      card: RockCard;
      chip: ChipColor;
    }
  | {
      type: 'ADVANCE_REVEAL_PHASE';
    }
  | {
      type: 'EXECUTE_PLACEMENT';
      playerId: string;
      targetCarrier?: CarrierColor; // RAINBOW 칩 제출자가 배치 시 지정한 받침대 (RED | GREEN | BLUE)
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
            type: 'LOCK_IN_SELECTION';
            card: RockCard;
            chip: ChipColor;
          }
        | {
            type: 'EXECUTE_PLACEMENT';
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
