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
  Player,
  RockCard,
  SanitizedGameState,
  SanitizedOpponent,
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
 * 라운드 선플레이어 인덱스부터 시계방향(0~6)으로 7인의 턴 대기열 생성
 */
export function buildRoundTurnQueue(
  players: Player[],
  starterIndex: number
): string[] {
  const ordered: string[] = [];
  for (let offset = 0; offset < TOTAL_PLAYERS; offset++) {
    const idx = (starterIndex + offset) % TOTAL_PLAYERS;
    const target = players.find((p) => p.slotIndex === idx);
    if (target) {
      ordered.push(target.id);
    }
  }
  return ordered;
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
        hasPassedThisRound: false,
        hasActedThisRound: false,
        isEliminated: false,
      };
    }
  );

  return {
    roomCode,
    phase: 'LOBBY',
    round: 1,
    half: 1,
    players,
    currentTurnPlayerId: hostId,
    roundStarterIndex: 0,
    turnQueue: buildRoundTurnQueue(players, 0),
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
      turnQueue: buildRoundTurnQueue(updatedPlayers, state.roundStarterIndex),
    },
    joined: true,
  };
}

/**
 * 게임 시작 (1라운드 개시, 전원 초기 카드 7장 및 색깔 칩 7개 지급)
 */
export function startGame(state: HostGameState): HostGameState {
  const players = state.players.map((p) => ({
    ...p,
    cards: createInitialCards(),
    chips: createInitialChips(),
    penaltyPoints: 0,
    hasPassedThisRound: false,
    hasActedThisRound: false,
    isEliminated: false,
  }));

  const turnQueue = buildRoundTurnQueue(players, 0);
  const firstPlayerId = turnQueue[0] ?? players[0].id;

  return {
    ...state,
    phase: 'PLAYING',
    round: 1,
    half: 1,
    players,
    roundStarterIndex: 0,
    turnQueue,
    passedQueue: [],
    currentTurnPlayerId: firstPlayerId,
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
 * 현재 플레이어가 패스(Pass)를 선언할 수 있는지 검증
 */
export function canPlayerPass(
  state: HostGameState,
  playerId: string
): boolean {
  if (state.phase !== 'PLAYING' || state.currentTurnPlayerId !== playerId) {
    return false;
  }
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.hasPassedThisRound || player.hasActedThisRound) {
    return false;
  }
  return state.turnQueue.length > 0 && state.turnQueue[0] === playerId;
}

/**
 * 제출 액션의 유효성을 엄격히 검증 (Host-Authoritative 검증용, 에러 코드는 번역 키로 반환)
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

  if (state.currentTurnPlayerId !== action.playerId) {
    return { valid: false, reason: 'err_NOT_YOUR_TURN' };
  }

  const player = state.players.find((p) => p.id === action.playerId);
  if (!player) {
    return { valid: false, reason: 'err_PLAYER_NOT_FOUND' };
  }

  if (action.type === 'PASS_TURN') {
    if (!canPlayerPass(state, action.playerId)) {
      return {
        valid: false,
        reason: 'err_CANNOT_PASS',
      };
    }
    return { valid: true };
  }

  if (action.type === 'SUBMIT_COMBO') {
    if (!player.cards.includes(action.card)) {
      return { valid: false, reason: 'err_CARD_NOT_OWNED' };
    }
    if (!player.chips.includes(action.chip)) {
      return { valid: false, reason: 'err_CHIP_NOT_OWNED' };
    }
    const targetColor = resolveTargetCarrier(action.chip, action.targetCarrier);
    if (!targetColor) {
      return {
        valid: false,
        reason: 'err_RAINBOW_TARGET_REQUIRED',
      };
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
 * 현재 라운드의 남은 턴을 계산하고, 전원 행동이 끝났다면 다음 라운드(또는 중간 정산 / 게임 종료)로 전환
 */
function advanceTurnOrRound(
  state: HostGameState,
  updatedPlayers: Player[],
  updatedTurnQueue: string[],
  updatedPassedQueue: string[],
  updatedCarriers: CarriersMap,
  lastSubmitted: SubmittedCombo | null,
  lastExplosion: ExplosionSnapshot | null,
  newLogs: GameLogEntry[]
): HostGameState {
  if (updatedTurnQueue.length > 0) {
    return {
      ...state,
      players: updatedPlayers,
      turnQueue: updatedTurnQueue,
      passedQueue: updatedPassedQueue,
      currentTurnPlayerId: updatedTurnQueue[0],
      carriers: updatedCarriers,
      lastSubmitted,
      lastExplosion,
      logs: newLogs,
    };
  }

  if (updatedPassedQueue.length > 0) {
    return {
      ...state,
      players: updatedPlayers,
      turnQueue: [],
      passedQueue: updatedPassedQueue,
      currentTurnPlayerId: updatedPassedQueue[0],
      carriers: updatedCarriers,
      lastSubmitted,
      lastExplosion,
      logs: newLogs,
    };
  }

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
      hasPassedThisRound: false,
      hasActedThisRound: false,
    }));

    const nextStarterIndex = (state.roundStarterIndex + 1) % TOTAL_PLAYERS;
    const nextQueue = buildRoundTurnQueue(refilledPlayers, nextStarterIndex);

    return {
      ...state,
      phase: 'HALF_TIME',
      half: 2,
      players: refilledPlayers,
      roundStarterIndex: nextStarterIndex,
      turnQueue: nextQueue,
      passedQueue: [],
      currentTurnPlayerId: nextQueue[0] ?? refilledPlayers[0].id,
      carriers: updatedCarriers,
      lastSubmitted,
      lastExplosion,
      logs: [...newLogs, halfTimeLog],
    };
  }

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
      players: finalPlayers,
      turnQueue: [],
      passedQueue: [],
      carriers: updatedCarriers,
      lastSubmitted,
      lastExplosion,
      eliminatedPlayerIds: eliminatedIds,
      logs: [...newLogs, gameOverLog],
    };
  }

  const nextRound = state.round + 1;
  const nextStarterIndex = (state.roundStarterIndex + 1) % TOTAL_PLAYERS;
  const resetPlayers = updatedPlayers.map((p) => ({
    ...p,
    hasPassedThisRound: false,
    hasActedThisRound: false,
  }));
  const nextQueue = buildRoundTurnQueue(resetPlayers, nextStarterIndex);
  const starterPlayer = resetPlayers.find(
    (p) => p.slotIndex === nextStarterIndex
  );

  const roundLog = createStructuredLog(
    nextRound,
    'ROUND_START',
    'ROUND_STARTED',
    {
      playerId: starterPlayer?.id,
      playerName: starterPlayer?.name ?? 'Player',
    }
  );

  return {
    ...state,
    round: nextRound,
    half: nextRound > HALF_ROUND ? 2 : 1,
    players: resetPlayers,
    roundStarterIndex: nextStarterIndex,
    turnQueue: nextQueue,
    passedQueue: [],
    currentTurnPlayerId: nextQueue[0] ?? resetPlayers[0].id,
    carriers: updatedCarriers,
    lastSubmitted,
    lastExplosion,
    logs: [...newLogs, roundLog],
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
        hasPassedThisRound: false,
        hasActedThisRound: false,
      }));
      const nextQueue = buildRoundTurnQueue(
        refilledPlayers,
        state.roundStarterIndex
      );
      const starterPlayer = refilledPlayers.find(
        (p) => p.slotIndex === state.roundStarterIndex
      );

      const startSecondHalfLog = createStructuredLog(
        nextRound,
        'ROUND_START',
        'SECOND_HALF_STARTED',
        {
          playerId: starterPlayer?.id,
          playerName: starterPlayer?.name ?? 'Player',
        }
      );

      // 중요: 7라운드 -> 8라운드 전환 시 손패(카드·칩)만 재지급하며,
      // 3개 짐꾼 받침대(carriers: RED, GREEN, BLUE)에 쌓인 돌(stones)과 합계(sum)는 그대로 유지한다.
      return {
        ...state,
        phase: 'PLAYING',
        round: nextRound,
        half: 2,
        players: refilledPlayers,
        turnQueue: nextQueue,
        passedQueue: [],
        currentTurnPlayerId: nextQueue[0] ?? refilledPlayers[0].id,
        carriers: state.carriers,
        logs: [...state.logs, startSecondHalfLog],
      };
    }

    case 'PASS_TURN': {
      const player = state.players.find((p) => p.id === action.playerId);
      if (!player) return state;

      const remainingTurnQueue = state.turnQueue.filter(
        (id) => id !== action.playerId
      );
      const updatedPassedQueue = [action.playerId, ...state.passedQueue];

      const updatedPlayers = state.players.map((p) =>
        p.id === action.playerId ? { ...p, hasPassedThisRound: true } : p
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

      return advanceTurnOrRound(
        state,
        updatedPlayers,
        remainingTurnQueue,
        updatedPassedQueue,
        state.carriers,
        state.lastSubmitted,
        state.lastExplosion,
        [...state.logs, passLog]
      );
    }

    case 'SUBMIT_COMBO': {
      const player = state.players.find((p) => p.id === action.playerId);
      if (!player) return state;

      const targetColor = resolveTargetCarrier(
        action.chip,
        action.targetCarrier
      );
      if (!targetColor) return state;

      const nextCards = removeOneItem(player.cards, action.card);
      const nextChips = removeOneItem(player.chips, action.chip);

      const currentPillar = state.carriers[targetColor];
      const previousSum = currentPillar.sum;
      const newSum = previousSum + action.card;
      const isExplosion = newSum >= EXPLOSION_THRESHOLD;

      const newStone: CarrierStone = {
        id: `stone-${state.round}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        value: action.card,
        playerId: player.id,
        playerName: player.name,
        chipColor: action.chip,
      };

      const stonesBeforeReset = [...currentPillar.stones, newStone];
      const penaltyAdded = isExplosion
        ? Math.max(1, stonesBeforeReset.length)
        : 0;

      const submittedCombo: SubmittedCombo = {
        playerId: player.id,
        playerName: player.name,
        card: action.card,
        chip: action.chip,
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
            penaltyAdded,
            round: state.round,
            explodedStones: stonesBeforeReset,
            timestamp: Date.now(),
          }
        : state.lastExplosion;

      const updatedPillar = isExplosion
        ? {
            color: targetColor,
            stones: [],
            sum: 0,
            lastChipColor: null,
          }
        : {
            color: targetColor,
            stones: stonesBeforeReset,
            sum: newSum,
            lastChipColor: action.chip,
          };

      const nextCarriers: CarriersMap = {
        ...state.carriers,
        [targetColor]: updatedPillar,
      };

      const updatedPlayers = state.players.map((p) =>
        p.id === player.id
          ? {
              ...p,
              cards: nextCards,
              chips: nextChips,
              penaltyPoints: p.penaltyPoints + penaltyAdded,
              hasActedThisRound: true,
            }
          : p
      );

      const remainingTurnQueue = state.turnQueue.filter(
        (id) => id !== player.id
      );
      const remainingPassedQueue = state.passedQueue.filter(
        (id) => id !== player.id
      );

      const actionLogs: GameLogEntry[] = [
        createStructuredLog(
          state.round,
          'SUBMIT',
          action.chip === 'RAINBOW' ? 'SUBMIT_RAINBOW' : 'SUBMIT_NORMAL',
          {
            playerId: player.id,
            playerName: player.name,
            card: action.card,
            chip: action.chip,
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
              penaltyAdded,
            },
            player.id
          )
        );
      }

      return advanceTurnOrRound(
        state,
        updatedPlayers,
        remainingTurnQueue,
        remainingPassedQueue,
        nextCarriers,
        submittedCombo,
        nextExplosion,
        [...state.logs, ...actionLogs]
      );
    }
  }
}

/**
 * 치팅 방지 직렬화(Sanitization) 함수
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
    hasPassedThisRound: p.hasPassedThisRound,
    hasActedThisRound: p.hasActedThisRound,
    isEliminated: p.isEliminated,
  }));

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
    round: state.round,
    half: state.half,
    myPlayerId: targetPlayerId,
    myHand: {
      cards: me ? [...me.cards] : [],
      chips: me ? [...me.chips] : [],
    },
    players: sanitizedPlayers,
    currentTurnPlayerId: state.currentTurnPlayerId,
    roundStarterIndex: state.roundStarterIndex,
    carriers: clonedCarriers,
    lastSubmitted: state.lastSubmitted ? { ...state.lastSubmitted } : null,
    lastExplosion: state.lastExplosion
      ? {
          ...state.lastExplosion,
          explodedStones: state.lastExplosion.explodedStones.map((s) => ({
            ...s,
          })),
        }
      : null,
    eliminatedPlayerIds: [...state.eliminatedPlayerIds],
    logs: state.logs.slice(-30),
  };
}
