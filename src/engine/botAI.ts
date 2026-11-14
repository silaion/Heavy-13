// src/engine/botAI.ts
import type {
  CarrierColor,
  ChipColor,
  GameAction,
  HostGameState,
  Player,
  RockCard,
} from '../types/game';
import {
  canPlayerPass,
  CARRIER_COLORS,
  EXPLOSION_THRESHOLD,
} from './rules';

export const BOT_MIN_DELAY_MS = 800;
export const BOT_MAX_DELAY_MS = 1500;
export const BOT_SUBOPTIMAL_PROBABILITY = 0.2; // 약 20%의 비최적수(실수) 확률

interface CandidateMove {
  card: RockCard;
  chip: ChipColor;
  targetCarrier: CarrierColor;
  currentPillarSum: number;
  resultingSum: number;
  causesExplosion: boolean;
  stonesCountBefore: number;
}

/**
 * 봇이 현재 손패(cards, chips)로 선택할 수 있는 모든 유효 제출 후보(CandidateMove)를 생성한다.
 */
function buildCandidateMoves(
  state: HostGameState,
  bot: Player
): CandidateMove[] {
  const uniqueCards = Array.from(new Set(bot.cards));
  const uniqueChips = Array.from(new Set(bot.chips));
  const candidates: CandidateMove[] = [];

  for (const chip of uniqueChips) {
    const targetColors: readonly CarrierColor[] =
      chip === 'RAINBOW' ? CARRIER_COLORS : [chip];

    for (const targetCarrier of targetColors) {
      const pillar = state.carriers[targetCarrier];
      for (const card of uniqueCards) {
        const resultingSum = pillar.sum + card;
        candidates.push({
          card,
          chip,
          targetCarrier,
          currentPillarSum: pillar.sum,
          resultingSum,
          causesExplosion: resultingSum >= EXPLOSION_THRESHOLD,
          stonesCountBefore: pillar.stones.length,
        });
      }
    }
  }

  return candidates;
}

/**
 * 휴리스틱 AI 봇 의사결정 알고리즘 (3색 받침대 RED / GREEN / BLUE 지원)
 *
 * [전략 명세]
 * 1. 안전 후보(`resultingSum < 13`)가 존재할 때:
 *    - 받침대 합계가 안전 구간(`currentPillarSum <= 6`)이면 보유 중인 고숫자 바위 카드(6, 5, 4...)를 최우선으로 소모한다.
 *    - 주의/위험 구간이지만 패스가 가능하다면, 안전하게 큰 숫자를 털 수 없는 한 패스(`PASS_TURN`)를 고려한다.
 *    - `RAINBOW` 칩은 가급적 후반을 위해 아끼고 일반 색상 칩(`RED`, `GREEN`, `BLUE`)을 우선 사용한다.
 * 2. 모든 후보가 13 이상 폭발(`causesExplosion === true`)할 때:
 *    - 패스가 가능하다면(`canPlayerPass`) 최우선으로 패스(`PASS_TURN`)하여 폭탄을 뒷순서로 미룬다.
 *    - 패스가 불가능하다면 어차피 폭발하여 해당 받침대가 `0`으로 리셋되므로,
 *      가장 벌점이 적게 드는 받침대(`stonesCountBefore` 최소)에 보유한 **가장 높은 숫자(최고 숫자)** 카드를 털어낸다.
 * 3. 약 20%의 비최적수(실수) 확률(`BOT_SUBOPTIMAL_PROBABILITY = 0.2`)을 조합한다.
 */
export function decideBotAction(
  state: HostGameState,
  botPlayerId: string,
  rng: () => number = Math.random
): GameAction {
  const bot: Player | undefined = state.players.find((p) => p.id === botPlayerId);
  if (!bot || bot.cards.length === 0 || bot.chips.length === 0) {
    return {
      type: 'PASS_TURN',
      playerId: botPlayerId,
    };
  }

  const passAvailable = canPlayerPass(state, botPlayerId);
  const isSuboptimal = rng() < BOT_SUBOPTIMAL_PROBABILITY;
  const allMoves = buildCandidateMoves(state, bot);

  if (allMoves.length === 0) {
    return {
      type: 'PASS_TURN',
      playerId: botPlayerId,
    };
  }

  const safeMoves = allMoves.filter((m) => !m.causesExplosion);

  // 20% 확률의 비최적수(실수) 분기
  if (isSuboptimal) {
    if (passAvailable && rng() < 0.3) {
      return {
        type: 'PASS_TURN',
        playerId: botPlayerId,
      };
    }
    const pool = safeMoves.length > 0 && rng() < 0.65 ? safeMoves : allMoves;
    const picked = pool[Math.floor(rng() * pool.length)] ?? allMoves[0];
    return {
      type: 'SUBMIT_COMBO',
      playerId: botPlayerId,
      card: picked.card,
      chip: picked.chip,
      targetCarrier: picked.targetCarrier,
    };
  }

  // 안전하게 낼 수 있는 조합이 하나도 없는 경우 (모든 받침대가 위험 구간)
  if (safeMoves.length === 0) {
    if (passAvailable) {
      return {
        type: 'PASS_TURN',
        playerId: botPlayerId,
      };
    }

    // 패스 불가 시: 쌓여있는 돌 개수(벌점)가 가장 적은 받침대에 가장 높은 숫자 카드를 털어낸다.
    const sortedExplosionMoves = [...allMoves].sort((a, b) => {
      if (a.stonesCountBefore !== b.stonesCountBefore) {
        return a.stonesCountBefore - b.stonesCountBefore;
      }
      if (b.card !== a.card) {
        return b.card - a.card;
      }
      if (a.chip === 'RAINBOW' && b.chip !== 'RAINBOW') return 1;
      if (a.chip !== 'RAINBOW' && b.chip === 'RAINBOW') return -1;
      return 0;
    });

    const bestExplosion = sortedExplosionMoves[0];
    return {
      type: 'SUBMIT_COMBO',
      playerId: botPlayerId,
      card: bestExplosion.card,
      chip: bestExplosion.chip,
      targetCarrier: bestExplosion.targetCarrier,
    };
  }

  // 안전 후보들이 있지만, 현재 낼 수 있는 모든 대상 받침대가 위험 구간(>= 10)이고 패스가 가능할 때는 패스 우선
  const minTargetSum = Math.min(...safeMoves.map((m) => m.currentPillarSum));
  if (minTargetSum >= 10 && passAvailable) {
    return {
      type: 'PASS_TURN',
      playerId: botPlayerId,
    };
  }

  // 안전 후보 중 최적수 선정:
  // 1) 일반 칩(비 RAINBOW) 우선 (RAINBOW 보존)
  // 2) 높은 숫자 바위 카드(6, 5, 4...) 우선 소모
  // 3) 결과 합계가 12에 가까워 상대방을 압박하는 수 선호
  const sortedSafeMoves = [...safeMoves].sort((a, b) => {
    const aRainbow = a.chip === 'RAINBOW' ? 1 : 0;
    const bRainbow = b.chip === 'RAINBOW' ? 1 : 0;
    if (aRainbow !== bRainbow) {
      return aRainbow - bRainbow;
    }
    if (b.card !== a.card) {
      return b.card - a.card;
    }
    return b.resultingSum - a.resultingSum;
  });

  const chosen = sortedSafeMoves[0];
  return {
    type: 'SUBMIT_COMBO',
    playerId: botPlayerId,
    card: chosen.card,
    chip: chosen.chip,
    targetCarrier: chosen.targetCarrier,
  };
}

/**
 * 봇 턴 진입 시 800ms ~ 1500ms 사이의 비동기 지연 후 액션을 디스패치하며,
 * 컴포넌트 언마운트나 게임 리셋/턴 변경 시 타이머가 누수되지 않도록 클린업 함수를 반환한다.
 */
export function scheduleBotTurn(
  state: HostGameState,
  dispatch: (action: GameAction) => void,
  rng: () => number = Math.random
): () => void {
  if (state.phase !== 'PLAYING') {
    return () => {};
  }

  const currentPlayer = state.players.find(
    (p) => p.id === state.currentTurnPlayerId
  );
  if (!currentPlayer || !currentPlayer.isBot) {
    return () => {};
  }

  const delayMs =
    Math.floor(rng() * (BOT_MAX_DELAY_MS - BOT_MIN_DELAY_MS + 1)) +
    BOT_MIN_DELAY_MS;

  let isCancelled = false;
  const timerId = globalThis.setTimeout(() => {
    if (isCancelled) return;
    const action = decideBotAction(state, currentPlayer.id, rng);
    dispatch(action);
  }, delayMs);

  return () => {
    isCancelled = true;
    globalThis.clearTimeout(timerId);
  };
}
