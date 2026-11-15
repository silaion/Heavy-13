// src/engine/rules.ts
import type {
  CarrierColor,
  CarriersMap,
  CarrierStone,
  ChipColor,
  ExplosionSnapshot,
  GameAction,
  GameLogEntry,
  GameLogEventKey,
  GameLogParams,
  HostGameState,
  PlacementQueueItem,
  Player,
  PlayerSubmission,
  RockCard,
  SanitizedGameState,
  SanitizedOpponent,
  SanitizedSubmission,
  SubmittedCombo,
} from '../types/game';

export const TOTAL_PLAYERS = 7;
export const MAX_ROUNDS = 14;
export const HALF_ROUND = 7;
export const EXPLOSION_THRESHOLD = 13;

export const CARRIER_COLORS: readonly CarrierColor[] = ['RED', 'GREEN', 'BLUE'];
export const INITIAL_ROCK_CARDS: readonly RockCard[] = [0, 1, 2, 3, 4, 5, 6];
export const INITIAL_CHIPS: readonly ChipColor[] = [
  'RED',
  'RED',
  'GREEN',
  'GREEN',
  'BLUE',
  'BLUE',
  'RAINBOW',
];

const BOT_NAMES: readonly string[] = [
  'AI 알파',
  'AI 베타',
  'AI 감마',
  'AI 델타',
  'AI 엡실론',
  'AI 제타',
  'AI 에타',
];

function createStructuredLog(
  round: number,
  type: GameLogEntry['type'],
  eventKey: GameLogEventKey,
  params?: GameLogParams,
  playerId?: string
): GameLogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    round,
    timestamp: Date.now(),
    type,
    eventKey,
    params,
    message: eventKey,
    playerId,
  };
}

/**
 * 초기 카드 7장 복제 반환
 */
export function createInitialCards(): RockCard[] {
  return [...INITIAL_ROCK_CARDS];
}

/**
 * 초기 색깔 칩 7개 복제 반환
 */
export function createInitialChips(): ChipColor[] {
  return [...INITIAL_CHIPS];
}

/**
 * 3색(RED, GREEN, BLUE) 빈 짐꾼 받침대(CarriersMap) 생성
 */
export function createInitialCarriers(): CarriersMap {
  return {
    RED: {
      color: 'RED',
      stones: [],
      sum: 0,
      lastChipColor: null,
    },
    GREEN: {
      color: 'GREEN',
      stones: [],
      sum: 0,
      lastChipColor: null,
    },
    BLUE: {
      color: 'BLUE',
      stones: [],
      sum: 0,
      lastChipColor: null,
    },
  };
}

/**
 * 선 플레이어(`starterSlotIndex`)를 기준으로 특정 슬롯(`slotIndex`)이 시계 방향으로 몇 번째에 위치하는지(0 ~ 6) 계산
 */
export function getClockwiseDistance(
  starterSlotIndex: number,
  targetSlotIndex: number
): number {
  return (targetSlotIndex - starterSlotIndex + TOTAL_PLAYERS) % TOTAL_PLAYERS;
}

/**
 * 7명 전원의 제출(`submissions`)을 바탕으로 원작 규칙에 따라 이번 라운드 큐브 배치 순서(`PlacementQueueItem[]`)를 정렬
 * - 1순위: `RAINBOW` 칩 제출자 최우선
 * - 2순위: 바위 카드 숫자가 더 높은 플레이어 우선 (`6 > 5 > 4 > 3 > 2 > 1 > 0`)
 * - 3순위(동순위 타이브레이커): 현재 라운드의 선 플레이어(`startPlayerId`)를 기준으로 시계 방향(슬롯 순환 순서)으로 앞선 플레이어 우선
 */
export function buildPlacementQueue(
  players: readonly Player[],
  submissions: Record<string, PlayerSubmission>,
  startPlayerId: string
): PlacementQueueItem[] {
  const starter = players.find((p) => p.id === startPlayerId) ?? players[0];
  const starterSlotIndex = starter ? starter.slotIndex : 0;

  const rawItems = players
    .map((p) => {
      const sub = submissions[p.id];
      if (!sub) return null;
      return {
        playerId: p.id,
        playerName: p.name,
        slotIndex: p.slotIndex,
        chip: sub.chip,
        card: sub.card,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  rawItems.sort((a, b) => {
    // 1순위: RAINBOW 칩 우선
    const aIsRainbow = a.chip === 'RAINBOW' ? 1 : 0;
    const bIsRainbow = b.chip === 'RAINBOW' ? 1 : 0;
    if (bIsRainbow !== aIsRainbow) {
      return bIsRainbow - aIsRainbow;
    }

    // 2순위: 바위 카드 숫자가 더 높은 쪽 우선 (내림차순)
    if (b.card !== a.card) {
      return b.card - a.card;
    }

    // 3순위: 선 플레이어 기준 시계 방향 거리 오름차순
    const distA = getClockwiseDistance(starterSlotIndex, a.slotIndex);
    const distB = getClockwiseDistance(starterSlotIndex, b.slotIndex);
    return distA - distB;
  });

  return rawItems.map((item, idx) => ({
    ...item,
    priorityOrder: idx + 1,
    status: 'PENDING',
  }));
}

/**
 * 로비에서 항상 7인 슬롯(인간 1~7명 + 부족한 만큼 로컬 AI 봇)으로 초기화된 HostGameState 생성
 */
export function createLobbyState(
  roomCode: string,
  hostId: string,
  hostName: string
): HostGameState {
  const players: Player[] = Array.from(
    { length: TOTAL_PLAYERS },
    (_, slotIndex) => {
      if (slotIndex === 0) {
        return {
          id: hostId,
          name: hostName.trim() || 'Host',
          slotIndex: 0,
          isHost: true,
          isBot: false,
          isConnected: true,
          cards: createInitialCards(),
          chips: createInitialChips(),
          penaltyPoints: 0,
          hasSubmittedThisRound: false,
          hasPassedThisRound: false,
          hasActedThisRound: false,
          isEliminated: false,
        };
      }
      return {
        id: `bot-${slotIndex}`,
        name: BOT_NAMES[slotIndex - 1] ?? `AI Bot ${slotIndex}`,
        slotIndex,
        isHost: false,
        isBot: true,
        isConnected: true,
        cards: createInitialCards(),
        chips: createInitialChips(),
        penaltyPoints: 0,
        hasSubmittedThisRound: false,
        hasPassedThisRound: false,
        hasActedThisRound: false,
        isEliminated: false,
      };
    }
  );

  return {
    roomCode,
    phase: 'LOBBY',
    roundPhase: 'SELECTION',
    round: 1,
    half: 1,
    players,
    startPlayerId: hostId,
    roundStarterIndex: 0,
    lastPenaltyPlayerIdInRound: null,
    submissions: {},
    placementQueue: [],
    currentTurnPlayerId: '',
    turnQueue: [],
    passedQueue: [],
    carriers: createInitialCarriers(),
    lastSubmitted: null,
    lastExplosion: null,
    eliminatedPlayerIds: [],
    logs: [createStructuredLog(1, 'ROUND_START', 'LOBBY_CREATED')],
  };
}

/**
 * 로비 상태에서 인간 Guest가 입장했을 때 봇 슬롯 하나를 인간 슬롯으로 교체 (재접속 포함)
 */
export function addGuestToLobby(
  state: HostGameState,
  guestId: string,
  guestName: string
): { state: HostGameState; joined: boolean; reason?: string } {
  const existingPlayer = state.players.find((p) => p.id === guestId);
  if (existingPlayer) {
    const updatedPlayers = state.players.map((p) =>
      p.id === guestId
        ? {
            ...p,
            name: guestName.trim() || p.name,
            isConnected: true,
            isBot: false,
          }
        : p
    );
    return {
      state: { ...state, players: updatedPlayers },
      joined: true,
    };
  }

  if (state.phase !== 'LOBBY') {
    return {
      state,
      joined: false,
      reason: 'err_ALREADY_PLAYING',
    };
  }

  const botSlot = state.players.find((p) => p.isBot);
  if (!botSlot) {
    return {
      state,
      joined: false,
      reason: 'err_ROOM_FULL',
    };
  }

  const sanitizedName = guestName.trim() || `Player ${botSlot.slotIndex + 1}`;
  const updatedPlayers = state.players.map((p) =>
    p.slotIndex === botSlot.slotIndex
      ? {
          ...p,
          id: guestId,
          name: sanitizedName,
          isBot: false,
          isConnected: true,
        }
      : p
  );

  return {
    state: {
      ...state,
      players: updatedPlayers,
    },
    joined: true,
  };
}

/**
 * 게임 시작 (1라운드 SELECTION 단계 개시, 전원 초기 카드 7장 및 색깔 칩 7개 지급)
 */
export function startGame(state: HostGameState): HostGameState {
  const players = state.players.map((p) => ({
    ...p,
    cards: createInitialCards(),
    chips: createInitialChips(),
    penaltyPoints: 0,
    hasSubmittedThisRound: false,
    hasPassedThisRound: false,
    hasActedThisRound: false,
    isEliminated: false,
  }));

  const starter = players[0];

  return {
    ...state,
    phase: 'PLAYING',
    roundPhase: 'SELECTION',
    round: 1,
    half: 1,
    players,
    startPlayerId: starter.id,
    roundStarterIndex: starter.slotIndex,
    lastPenaltyPlayerIdInRound: null,
    submissions: {},
    placementQueue: [],
    currentTurnPlayerId: '',
    turnQueue: [],
    passedQueue: [],
    carriers: createInitialCarriers(),
    lastSubmitted: null,
    lastExplosion: null,
    eliminatedPlayerIds: [],
    logs: [createStructuredLog(1, 'ROUND_START', 'GAME_STARTED')],
  };
}

/**
 * 선택한 칩과 targetCarrier로부터 실제 돌이 올라갈 대상 받침대 색상(RED | GREEN | BLUE)을 결정
 */
export function resolveTargetCarrier(
  chip: ChipColor,
  targetCarrier?: CarrierColor
): CarrierColor | null {
  if (chip === 'RED' || chip === 'GREEN' || chip === 'BLUE') {
    return chip;
  }
  if (chip === 'RAINBOW') {
    if (
      targetCarrier === 'RED' ||
      targetCarrier === 'GREEN' ||
      targetCarrier === 'BLUE'
    ) {
      return targetCarrier;
    }
    return null;
  }
  return null;
}

/**
 * 보유한 칩인지 확인
 */
export function isChipPlayable(
  chip: ChipColor,
  playerHandChips: readonly ChipColor[]
): boolean {
  return playerHandChips.includes(chip);
}

/**
 * PLACEMENT 단계에서 현재 차례인 플레이어가 패스(Pass)를 선언할 수 있는지 검증
 * - 이번 라운드에서 아직 패스를 사용하지 않았고(`!hasPassedThisRound`)
 * - 1차 배치 대기열(`turnQueue`)에서 자신의 차례일 때만 패스 가능 (이미 패스하여 `passedQueue`로 넘어간 역순 배치 차례에는 재패스 불가)
 */
export function canPlayerPass(
  state: HostGameState,
  playerId: string
): boolean {
  if (
    state.phase !== 'PLAYING' ||
    state.roundPhase !== 'PLACEMENT' ||
    state.currentTurnPlayerId !== playerId
  ) {
    return false;
  }
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.hasPassedThisRound || player.hasActedThisRound) {
    return false;
  }
  return state.turnQueue.length > 0 && state.turnQueue[0] === playerId;
}

/**
 * 액션의 유효성을 엄격히 검증 (Host-Authoritative 검증용)
 */
export function validateAction(
  state: HostGameState,
  action: GameAction
): { valid: boolean; reason?: string } {
  if (action.type === 'RESET_TO_LOBBY') {
    return { valid: true };
  }

  if (action.type === 'REPLACE_WITH_BOT') {
    const target = state.players.find((p) => p.id === action.playerId);
    if (!target) {
      return { valid: false, reason: 'err_TARGET_NOT_FOUND' };
    }
    return { valid: true };
  }

  if (action.type === 'PROCEED_FROM_HALF_TIME') {
    if (state.phase !== 'HALF_TIME') {
      return { valid: false, reason: 'err_NOT_HALF_TIME' };
    }
    return { valid: true };
  }

  if (state.phase !== 'PLAYING') {
    return { valid: false, reason: 'err_NOT_PLAYING' };
  }

  if (action.type === 'ADVANCE_REVEAL_PHASE') {
    if (
      state.roundPhase !== 'REVEAL_CHIPS' &&
      state.roundPhase !== 'REVEAL_CARDS'
    ) {
      return { valid: false, reason: 'err_UNKNOWN_ACTION' };
    }
    return { valid: true };
  }

  if (action.type === 'LOCK_IN_SELECTION') {
    if (state.roundPhase !== 'SELECTION') {
      return { valid: false, reason: 'err_NOT_SELECTION_PHASE' };
    }
    const player = state.players.find((p) => p.id === action.playerId);
    if (!player) {
      return { valid: false, reason: 'err_PLAYER_NOT_FOUND' };
    }
    if (player.hasSubmittedThisRound) {
      return { valid: false, reason: 'err_ALREADY_SUBMITTED' };
    }
    if (!player.cards.includes(action.card)) {
      return { valid: false, reason: 'err_CARD_NOT_OWNED' };
    }
    if (!player.chips.includes(action.chip)) {
      return { valid: false, reason: 'err_CHIP_NOT_OWNED' };
    }
    return { valid: true };
  }

  if (action.type === 'PASS_TURN') {
    if (state.roundPhase !== 'PLACEMENT') {
      return { valid: false, reason: 'err_NOT_YOUR_TURN' };
    }
    if (state.currentTurnPlayerId !== action.playerId) {
      return { valid: false, reason: 'err_NOT_YOUR_TURN' };
    }
    if (!canPlayerPass(state, action.playerId)) {
      return { valid: false, reason: 'err_CANNOT_PASS' };
    }
    return { valid: true };
  }

  if (action.type === 'EXECUTE_PLACEMENT') {
    if (state.roundPhase !== 'PLACEMENT') {
      return { valid: false, reason: 'err_NOT_YOUR_TURN' };
    }
    if (state.currentTurnPlayerId !== action.playerId) {
      return { valid: false, reason: 'err_NOT_YOUR_TURN' };
    }
    const sub = state.submissions[action.playerId];
    if (!sub) {
      return { valid: false, reason: 'err_PLAYER_NOT_FOUND' };
    }
    const targetColor = resolveTargetCarrier(sub.chip, action.targetCarrier);
    if (!targetColor) {
      return { valid: false, reason: 'err_RAINBOW_TARGET_REQUIRED' };
    }
    return { valid: true };
  }

  return { valid: false, reason: 'err_UNKNOWN_ACTION' };
}

/**
 * 배열에서 특정 원소 1개만 제거한 새 배열 반환 (순수 함수)
 */
function removeOneItem<T>(items: readonly T[], target: T): T[] {
  const index = items.indexOf(target);
  if (index === -1) return [...items];
  return [...items.slice(0, index), ...items.slice(index + 1)];
}

/**
 * 14라운드 종료 시 누적 벌점 최하위(벌점이 가장 높은) 2명을 판정
 */
export function determineEliminatedPlayers(
  players: readonly Player[]
): string[] {
  const sorted = [...players].sort((a, b) => {
    if (b.penaltyPoints !== a.penaltyPoints) {
      return b.penaltyPoints - a.penaltyPoints;
    }
    const sumA = a.cards.reduce<number>((acc, c) => acc + c, 0);
    const sumB = b.cards.reduce<number>((acc, c) => acc + c, 0);
    if (sumB !== sumA) {
      return sumB - sumA;
    }
    return b.slotIndex - a.slotIndex;
  });

  return sorted.slice(0, 2).map((p) => p.id);
}

/**
 * PLACEMENT 단계에서 한 명의 배치 또는 패스가 끝난 후 다음 배치 차례 또는 라운드 종료(ROUND_END -> 다음 라운드) 처리
 * - 라운드 종료 시 선 플레이어 갱신 규칙:
 *   이번 라운드에서 가장 마지막으로 벌점을 받은 플레이어(`lastPenaltyPlayerIdInRound`)가 다음 라운드의 선 플레이어(`startPlayerId`)가 된다.
 *   아무도 벌점을 받지 않았다면 기존 `startPlayerId`를 유지한다.
 */
function advancePlacementOrRound(
  state: HostGameState,
  updatedPlayers: Player[],
  updatedPlacementQueue: PlacementQueueItem[],
  updatedTurnQueue: string[],
  updatedPassedQueue: string[],
  updatedCarriers: CarriersMap,
  lastSubmitted: SubmittedCombo | null,
  lastExplosion: ExplosionSnapshot | null,
  lastPenaltyPlayerIdInRound: string | null,
  newLogs: GameLogEntry[]
): HostGameState {
  // 1) 일반 배치 대기열(turnQueue)에 남은 플레이어가 있으면 다음 순서 진행
  if (updatedTurnQueue.length > 0) {
    return {
      ...state,
      players: updatedPlayers,
      placementQueue: updatedPlacementQueue,
      turnQueue: updatedTurnQueue,
      passedQueue: updatedPassedQueue,
      currentTurnPlayerId: updatedTurnQueue[0],
      carriers: updatedCarriers,
      lastSubmitted,
      lastExplosion,
      lastPenaltyPlayerIdInRound,
      logs: newLogs,
    };
  }

  // 2) 일반 배치 대기열이 모두 끝났고 패스 대기열(passedQueue)에 플레이어가 남아있다면
  // 패스를 선언한 순서의 역순(LIFO)으로 큐브 배치 진행
  if (updatedPassedQueue.length > 0) {
    return {
      ...state,
      players: updatedPlayers,
      placementQueue: updatedPlacementQueue,
      turnQueue: [],
      passedQueue: updatedPassedQueue,
      currentTurnPlayerId: updatedPassedQueue[0],
      carriers: updatedCarriers,
      lastSubmitted,
      lastExplosion,
      lastPenaltyPlayerIdInRound,
      logs: newLogs,
    };
  }

  // 3) 7명 전원의 큐브 배치가 완료된 경우 -> 다음 라운드 선 플레이어(startPlayerId) 결정
  const nextStartPlayerId =
    lastPenaltyPlayerIdInRound ?? state.startPlayerId;
  const nextStarterPlayer =
    updatedPlayers.find((p) => p.id === nextStartPlayerId) ??
    updatedPlayers[0];
  const nextStarterIndex = nextStarterPlayer.slotIndex;

  const logsWithStarter = [...newLogs];
  if (
    lastPenaltyPlayerIdInRound &&
    lastPenaltyPlayerIdInRound !== state.startPlayerId
  ) {
    logsWithStarter.push(
      createStructuredLog(
        state.round,
        'ROUND_START',
        'STARTER_UPDATED',
        {
          playerId: nextStarterPlayer.id,
          playerName: nextStarterPlayer.name,
        },
        nextStarterPlayer.id
      )
    );
  }

  // 7라운드 종료 직후: 중간 정산(HALF_TIME) 진입 (손패만 재지급, 받침대 돌과 합계는 그대로 유지)
  if (state.round === HALF_ROUND) {
    const halfTimeLog = createStructuredLog(
      state.round,
      'HALF_TIME',
      'HALF_TIME_REACHED'
    );

    const refilledPlayers = updatedPlayers.map((p) => ({
      ...p,
      cards: createInitialCards(),
      chips: createInitialChips(),
      hasSubmittedThisRound: false,
      hasPassedThisRound: false,
      hasActedThisRound: false,
    }));

    return {
      ...state,
      phase: 'HALF_TIME',
      roundPhase: 'ROUND_END',
      half: 2,
      players: refilledPlayers,
      startPlayerId: nextStarterPlayer.id,
      roundStarterIndex: nextStarterIndex,
      lastPenaltyPlayerIdInRound: null,
      submissions: {},
      placementQueue: updatedPlacementQueue,
      turnQueue: [],
      passedQueue: [],
      currentTurnPlayerId: '',
      carriers: updatedCarriers,
      lastSubmitted,
      lastExplosion,
      logs: [...logsWithStarter, halfTimeLog],
    };
  }

  // 14라운드 종료 직후: 최종 누적 벌점 최하위 2명 탈락 판정
  if (state.round >= MAX_ROUNDS) {
    const eliminatedIds = determineEliminatedPlayers(updatedPlayers);
    const finalPlayers = updatedPlayers.map((p) => ({
      ...p,
      isEliminated: eliminatedIds.includes(p.id),
    }));
    const eliminatedSummary = finalPlayers
      .filter((p) => p.isEliminated)
      .map((p) => ({
        id: p.id,
        name: p.name,
        penaltyPoints: p.penaltyPoints,
      }));

    const gameOverLog = createStructuredLog(
      state.round,
      'GAME_OVER',
      'GAME_OVER',
      {
        eliminatedPlayers: eliminatedSummary,
      }
    );

    return {
      ...state,
      phase: 'GAME_OVER',
      roundPhase: 'ROUND_END',
      players: finalPlayers,
      placementQueue: updatedPlacementQueue,
      turnQueue: [],
      passedQueue: [],
      currentTurnPlayerId: '',
      carriers: updatedCarriers,
      lastSubmitted,
      lastExplosion,
      eliminatedPlayerIds: eliminatedIds,
      logs: [...logsWithStarter, gameOverLog],
    };
  }

  // 일반 다음 라운드 전환 (SELECTION 단계로 진입)
  const nextRound = state.round + 1;
  const resetPlayers = updatedPlayers.map((p) => ({
    ...p,
    hasSubmittedThisRound: false,
    hasPassedThisRound: false,
    hasActedThisRound: false,
  }));

  const roundLog = createStructuredLog(
    nextRound,
    'ROUND_START',
    'ROUND_STARTED',
    {
      playerId: nextStarterPlayer.id,
      playerName: nextStarterPlayer.name,
    }
  );

  return {
    ...state,
    round: nextRound,
    roundPhase: 'SELECTION',
    half: nextRound > HALF_ROUND ? 2 : 1,
    players: resetPlayers,
    startPlayerId: nextStarterPlayer.id,
    roundStarterIndex: nextStarterIndex,
    lastPenaltyPlayerIdInRound: null,
    submissions: {},
    placementQueue: [],
    turnQueue: [],
    passedQueue: [],
    currentTurnPlayerId: '',
    carriers: updatedCarriers,
    lastSubmitted,
    lastExplosion,
    logs: [...logsWithStarter, roundLog],
  };
}

/**
 * 순수 함수 기반 Host-Authoritative 게임 상태 리듀서
 */
export function gameReducer(
  state: HostGameState,
  action: GameAction
): HostGameState {
  const validation = validateAction(state, action);
  if (!validation.valid) {
    return state;
  }

  switch (action.type) {
    case 'RESET_TO_LOBBY': {
      const host = state.players.find((p) => p.isHost) ?? state.players[0];
      return createLobbyState(state.roomCode, host.id, host.name);
    }

    case 'REPLACE_WITH_BOT': {
      const target = state.players.find((p) => p.id === action.playerId);
      if (!target || target.isBot) {
        return state;
      }
      const botName = `${target.name} (AI)`;
      const updatedPlayers = state.players.map((p) =>
        p.id === action.playerId
          ? {
              ...p,
              isBot: true,
              isConnected: false,
              name: botName,
            }
          : p
      );

      const botLog = createStructuredLog(
        state.round,
        'BOT_TAKEOVER',
        'BOT_TAKEOVER',
        {
          playerId: target.id,
          playerName: target.name,
        },
        target.id
      );

      return {
        ...state,
        players: updatedPlayers,
        logs: [...state.logs, botLog],
      };
    }

    case 'PROCEED_FROM_HALF_TIME': {
      const nextRound = HALF_ROUND + 1; // 8라운드
      const refilledPlayers = state.players.map((p) => ({
        ...p,
        cards: createInitialCards(),
        chips: createInitialChips(),
        hasSubmittedThisRound: false,
        hasPassedThisRound: false,
        hasActedThisRound: false,
      }));
      const starterPlayer =
        refilledPlayers.find((p) => p.id === state.startPlayerId) ??
        refilledPlayers[0];

      const startSecondHalfLog = createStructuredLog(
        nextRound,
        'ROUND_START',
        'SECOND_HALF_STARTED',
        {
          playerId: starterPlayer.id,
          playerName: starterPlayer.name,
        }
      );

      // 7라운드 -> 8라운드 전환 시 손패(카드·칩)만 재지급하고 받침대(carriers)는 그대로 유지
      return {
        ...state,
        phase: 'PLAYING',
        roundPhase: 'SELECTION',
        round: nextRound,
        half: 2,
        players: refilledPlayers,
        startPlayerId: starterPlayer.id,
        roundStarterIndex: starterPlayer.slotIndex,
        lastPenaltyPlayerIdInRound: null,
        submissions: {},
        placementQueue: [],
        turnQueue: [],
        passedQueue: [],
        currentTurnPlayerId: '',
        carriers: state.carriers,
        logs: [...state.logs, startSecondHalfLog],
      };
    }

    case 'LOCK_IN_SELECTION': {
      const player = state.players.find((p) => p.id === action.playerId);
      if (!player) return state;

      // 손패에서 제출한 카드 1장과 칩 1개 차감
      const nextCards = removeOneItem(player.cards, action.card);
      const nextChips = removeOneItem(player.chips, action.chip);

      const updatedPlayers = state.players.map((p) =>
        p.id === player.id
          ? {
              ...p,
              cards: nextCards,
              chips: nextChips,
              hasSubmittedThisRound: true,
            }
          : p
      );

      const nextSubmissions: Record<string, PlayerSubmission> = {
        ...state.submissions,
        [player.id]: {
          playerId: player.id,
          playerName: player.name,
          chip: action.chip,
          card: action.card,
        },
      };

      const allSubmitted = updatedPlayers.every((p) => p.hasSubmittedThisRound);

      if (!allSubmitted) {
        return {
          ...state,
          players: updatedPlayers,
          submissions: nextSubmissions,
        };
      }

      // 7명 전원 제출 완료 -> 즉시 1차 공개(REVEAL_CHIPS: 색깔 칩 일제 공개) 단계로 전환
      const revealChipsLog = createStructuredLog(
        state.round,
        'ROUND_START',
        'CHIPS_REVEALED'
      );

      return {
        ...state,
        roundPhase: 'REVEAL_CHIPS',
        players: updatedPlayers,
        submissions: nextSubmissions,
        logs: [...state.logs, revealChipsLog],
      };
    }

    case 'ADVANCE_REVEAL_PHASE': {
      if (state.roundPhase === 'REVEAL_CHIPS') {
        // 1차 공개(칩) -> 2차 공개(REVEAL_CARDS: 바위 카드 공개 및 우선순위 배치 순서 확정)
        const sortedQueue = buildPlacementQueue(
          state.players,
          state.submissions,
          state.startPlayerId
        );
        const revealCardsLog = createStructuredLog(
          state.round,
          'ROUND_START',
          'CARDS_REVEALED'
        );

        return {
          ...state,
          roundPhase: 'REVEAL_CARDS',
          placementQueue: sortedQueue,
          logs: [...state.logs, revealCardsLog],
        };
      }

      if (state.roundPhase === 'REVEAL_CARDS') {
        // 2차 공개(카드) -> 순차 배치 및 패스 단계(PLACEMENT) 진입
        const sortedQueue =
          state.placementQueue.length > 0
            ? state.placementQueue
            : buildPlacementQueue(
                state.players,
                state.submissions,
                state.startPlayerId
              );
        const turnOrderIds = sortedQueue.map((item) => item.playerId);

        return {
          ...state,
          roundPhase: 'PLACEMENT',
          placementQueue: sortedQueue,
          turnQueue: turnOrderIds,
          passedQueue: [],
          currentTurnPlayerId: turnOrderIds[0] ?? '',
        };
      }

      return state;
    }

    case 'PASS_TURN': {
      const player = state.players.find((p) => p.id === action.playerId);
      if (!player) return state;

      // 1차 대기열(turnQueue)에서 제거하고 패스 대기열(passedQueue)의 맨 앞(LIFO 역순 배치)에 추가
      const remainingTurnQueue = state.turnQueue.filter(
        (id) => id !== action.playerId
      );
      const updatedPassedQueue = [action.playerId, ...state.passedQueue];

      const updatedPlayers = state.players.map((p) =>
        p.id === action.playerId ? { ...p, hasPassedThisRound: true } : p
      );

      const updatedPlacementQueue = state.placementQueue.map((item) =>
        item.playerId === action.playerId
          ? { ...item, status: 'PASSED' as const }
          : item
      );

      const passLog = createStructuredLog(
        state.round,
        'PASS',
        'PASS_TURN',
        {
          playerId: player.id,
          playerName: player.name,
        },
        player.id
      );

      return advancePlacementOrRound(
        state,
        updatedPlayers,
        updatedPlacementQueue,
        remainingTurnQueue,
        updatedPassedQueue,
        state.carriers,
        state.lastSubmitted,
        state.lastExplosion,
        state.lastPenaltyPlayerIdInRound,
        [...state.logs, passLog]
      );
    }

    case 'EXECUTE_PLACEMENT': {
      const player = state.players.find((p) => p.id === action.playerId);
      const submission = state.submissions[action.playerId];
      if (!player || !submission) return state;

      const targetColor = resolveTargetCarrier(
        submission.chip,
        action.targetCarrier
      );
      if (!targetColor) return state;

      const currentPillar = state.carriers[targetColor];
      const previousStones = currentPillar.stones;
      const previousSum = currentPillar.sum;
      const newSum = previousSum + submission.card;
      const isExplosion = newSum >= EXPLOSION_THRESHOLD;

      const newStone: CarrierStone = {
        id: `stone-${state.round}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        value: submission.card,
        playerId: player.id,
        playerName: player.name,
        chipColor: submission.chip,
      };

      // [원작 핵심 13 폭발 및 수거 규칙]
      // - 합계가 13 이상이 되면: 방금 배치한 큐브를 제외한, 배치 직전까지 놓여 있었던 기존 바위 큐브들을 모두 수거한다.
      // - 해당 플레이어는 수거된 기존 바위 큐브의 개수(previousStones.length)만큼 벌점을 받는다.
      // - 방금 배치하여 13을 넘긴 새로운 바위 큐브 1개만 해당 받침대의 1층 첫 번째 칸에 남고,
      //   받침대의 현재 합계(sum)는 그 큐브의 숫자 값(submission.card)으로 갱신된다.
      const collectedCount = isExplosion ? previousStones.length : 0;
      const penaltyAdded = collectedCount;
      const newBaseSum = isExplosion ? submission.card : newSum;

      const submittedCombo: SubmittedCombo = {
        playerId: player.id,
        playerName: player.name,
        card: submission.card,
        chip: submission.chip,
        targetCarrier: targetColor,
        round: state.round,
        causedExplosion: isExplosion,
      };

      const nextExplosion: ExplosionSnapshot | null = isExplosion
        ? {
            id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            carrierColor: targetColor,
            playerId: player.id,
            playerName: player.name,
            finalSum: newSum,
            newBaseSum: submission.card,
            penaltyAdded,
            round: state.round,
            explodedStones: [...previousStones, newStone],
            collectedCount,
            remainingStone: newStone,
            timestamp: Date.now(),
          }
        : state.lastExplosion;

      const updatedPillar = isExplosion
        ? {
            color: targetColor,
            stones: [newStone], // 새로운 바위 큐브 1개만 받침대 1층 첫 칸에 잔류
            sum: submission.card, // 현재 합계는 방금 올린 큐브 숫자 값으로 갱신
            lastChipColor: submission.chip,
          }
        : {
            color: targetColor,
            stones: [...previousStones, newStone],
            sum: newSum,
            lastChipColor: submission.chip,
          };

      const nextCarriers: CarriersMap = {
        ...state.carriers,
        [targetColor]: updatedPillar,
      };

      const updatedPlayers = state.players.map((p) =>
        p.id === player.id
          ? {
              ...p,
              penaltyPoints: p.penaltyPoints + penaltyAdded,
              hasActedThisRound: true,
            }
          : p
      );

      const updatedPlacementQueue = state.placementQueue.map((item) =>
        item.playerId === player.id
          ? {
              ...item,
              status: 'PLACED' as const,
              placedCarrier: targetColor,
            }
          : item
      );

      const remainingTurnQueue = state.turnQueue.filter(
        (id) => id !== player.id
      );
      const remainingPassedQueue = state.passedQueue.filter(
        (id) => id !== player.id
      );

      // 이번 라운드에서 가장 마지막으로 벌점을 받은 플레이어 ID 기록 (다음 라운드 선 플레이어)
      const nextLastPenaltyPlayerId =
        isExplosion && penaltyAdded > 0
          ? player.id
          : state.lastPenaltyPlayerIdInRound;

      const actionLogs: GameLogEntry[] = [
        createStructuredLog(
          state.round,
          'SUBMIT',
          submission.chip === 'RAINBOW' ? 'SUBMIT_RAINBOW' : 'SUBMIT_NORMAL',
          {
            playerId: player.id,
            playerName: player.name,
            card: submission.card,
            chip: submission.chip,
            targetCarrier: targetColor,
            previousSum,
            newSum,
          },
          player.id
        ),
      ];

      if (isExplosion) {
        actionLogs.push(
          createStructuredLog(
            state.round,
            'EXPLOSION',
            'EXPLOSION',
            {
              playerId: player.id,
              playerName: player.name,
              targetCarrier: targetColor,
              newSum,
              newBaseSum,
              penaltyAdded,
              collectedCount,
            },
            player.id
          )
        );
      }

      return advancePlacementOrRound(
        state,
        updatedPlayers,
        updatedPlacementQueue,
        remainingTurnQueue,
        remainingPassedQueue,
        nextCarriers,
        submittedCombo,
        nextExplosion,
        nextLastPenaltyPlayerId,
        [...state.logs, ...actionLogs]
      );
    }
  }
}

/**
 * 치팅 방지 직렬화(Sanitization) 함수
 * - SELECTION 단계에서는 타인의 제출 카드/칩을 모두 null로 마스킹(`hasSubmitted: true`만 공개)
 * - REVEAL_CHIPS 단계에서는 전원의 `chip`만 공개하고 타인의 `card`는 null로 마스킹, `placementQueue`도 아직 비공개
 * - REVEAL_CARDS / PLACEMENT / ROUND_END 단계에서는 `chip`, `card`, `placementQueue` 전체 공개
 */
export function sanitizeGameStateForPlayer(
  state: HostGameState,
  targetPlayerId: string
): SanitizedGameState {
  const me = state.players.find((p) => p.id === targetPlayerId);

  const sanitizedPlayers: SanitizedOpponent[] = state.players.map((p) => ({
    id: p.id,
    name: p.name,
    slotIndex: p.slotIndex,
    isHost: p.isHost,
    isBot: p.isBot,
    isConnected: p.isConnected,
    remainingCards: p.cards.length,
    remainingChips: p.chips.length,
    penaltyPoints: p.penaltyPoints,
    hasSubmittedThisRound: p.hasSubmittedThisRound,
    hasPassedThisRound: p.hasPassedThisRound,
    hasActedThisRound: p.hasActedThisRound,
    isEliminated: p.isEliminated,
  }));

  const canSeeChips =
    state.roundPhase === 'REVEAL_CHIPS' ||
    state.roundPhase === 'REVEAL_CARDS' ||
    state.roundPhase === 'PLACEMENT' ||
    state.roundPhase === 'ROUND_END';

  const canSeeCards =
    state.roundPhase === 'REVEAL_CARDS' ||
    state.roundPhase === 'PLACEMENT' ||
    state.roundPhase === 'ROUND_END';

  const sanitizedSubmissions: Record<string, SanitizedSubmission> = {};
  for (const p of state.players) {
    const rawSub = state.submissions[p.id];
    const isMe = p.id === targetPlayerId;
    if (!rawSub) {
      sanitizedSubmissions[p.id] = {
        playerId: p.id,
        playerName: p.name,
        hasSubmitted: false,
        chip: null,
        card: null,
      };
    } else {
      sanitizedSubmissions[p.id] = {
        playerId: p.id,
        playerName: p.name,
        hasSubmitted: true,
        chip: isMe || canSeeChips ? rawSub.chip : null,
        card: isMe || canSeeCards ? rawSub.card : null,
      };
    }
  }

  const sanitizedPlacementQueue: PlacementQueueItem[] = canSeeCards
    ? state.placementQueue.map((item) => ({ ...item }))
    : [];

  const clonedCarriers: CarriersMap = {
    RED: {
      ...state.carriers.RED,
      stones: state.carriers.RED.stones.map((s) => ({ ...s })),
    },
    GREEN: {
      ...state.carriers.GREEN,
      stones: state.carriers.GREEN.stones.map((s) => ({ ...s })),
    },
    BLUE: {
      ...state.carriers.BLUE,
      stones: state.carriers.BLUE.stones.map((s) => ({ ...s })),
    },
  };

  return {
    roomCode: state.roomCode,
    phase: state.phase,
    roundPhase: state.roundPhase,
    round: state.round,
    half: state.half,
    myPlayerId: targetPlayerId,
    myHand: {
      cards: me ? [...me.cards] : [],
      chips: me ? [...me.chips] : [],
    },
    players: sanitizedPlayers,
    startPlayerId: state.startPlayerId,
    roundStarterIndex: state.roundStarterIndex,
    submissions: sanitizedSubmissions,
    placementQueue: sanitizedPlacementQueue,
    currentTurnPlayerId: state.currentTurnPlayerId,
    turnQueue: [...state.turnQueue],
    passedQueue: [...state.passedQueue],
    carriers: clonedCarriers,
    lastSubmitted: state.lastSubmitted ? { ...state.lastSubmitted } : null,
    lastExplosion: state.lastExplosion
      ? {
          ...state.lastExplosion,
          explodedStones: state.lastExplosion.explodedStones.map((s) => ({
            ...s,
          })),
          remainingStone: { ...state.lastExplosion.remainingStone },
        }
      : null,
    eliminatedPlayerIds: [...state.eliminatedPlayerIds],
    logs: state.logs.slice(-30),
  };
}
