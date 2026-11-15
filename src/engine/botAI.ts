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

export const BOT_SELECTION_MIN_DELAY_MS = 500;
export const BOT_SELECTION_MAX_DELAY_MS = 1450;
export const BOT_PLACEMENT_MIN_DELAY_MS = 800;
export const BOT_PLACEMENT_MAX_DELAY_MS = 1400;

// 확률 상수 (적당한 난이도 및 인간미 부여)
export const BOT_TOP_CHOICE_PROBABILITY = 0.75; // 동시 선택 시 75% 확률로 1순위, 25% 확률로 2순위 후보 선택
export const BOT_PASS_ON_OVERLOAD_PROBABILITY = 0.8; // 뒤에 같은 색/레인보우 제출자가 남아 있을 때 80% 확률로 패스
export const BOT_LOW_PENALTY_ACCEPT_PROBABILITY = 0.4; // 수거될 돌이 1개(벌점 1점)뿐일 때 40% 확률로 즉시 감수 배치

export interface ScoredSelectionCandidate {
  chip: ChipColor;
  card: RockCard;
  score: number;
  isSafe: boolean;
  reason: string;
}

export interface BotPlacementDecision {
  action: 'PLACE' | 'PASS';
  targetColor: CarrierColor;
  reason: string;
}

/**
 * 일반 색깔 칩(RED | GREEN | BLUE) + 바위 카드(0~6) 조합의 휴리스틱 점수를 계산한다.
 */
function scoreNormalChipCardCombo(
  carrierSum: number,
  stonesCount: number,
  card: RockCard,
  roundInHalf: number
): { score: number; isSafe: boolean; reason: string } {
  const projectedSum = carrierSum + card;
  const isSafe = projectedSum < EXPLOSION_THRESHOLD;

  // 1) 안전 배치 가능한 경우 (sum + card < 13)
  if (isSafe) {
    const headroom = EXPLOSION_THRESHOLD - 1 - projectedSum; // 12까지의 여유분 (0 이상)

    // [안전 구간: sum <= 6]
    // 여유 공간이 충분하므로 4, 5, 6 같은 높은 숫자 카드를 우선 조합해 선순위 배치권을 잡고 고숫자를 털어낸다.
    if (carrierSum <= 6) {
      const highCardBonus = card >= 4 ? 32 + card * 6 : card * 4;
      const pressureBonus = projectedSum >= 9 && projectedSum <= 11 ? 10 : 0;
      return {
        score: 100 + highCardBonus + pressureBonus,
        isSafe: true,
        reason: `SAFE_ZONE(sum=${carrierSum})+CARD(${card})`,
      };
    }

    // [중간 구간: 7 <= sum <= 10]
    // 앞순서 플레이어가 먼저 합계를 올릴 가능성을 감안해 13 - sum보다 2~3 이상 여유가 있는 중간/낮은 카드(1, 2, 3)를 선호한다.
    if (carrierSum <= 10) {
      const hasSafetyMargin = headroom >= 2; // 합계가 10 이하로 끝나는 여유 있는 카드
      const midLowCardBonus =
        card >= 1 && card <= 3
          ? 28 + (hasSafetyMargin ? 18 : 0)
          : card === 0
            ? 14 // 0 카드는 더 위험한 순간을 위해 가급적 아낌
            : 8;
      const marginAdjustment = hasSafetyMargin ? headroom * 3 : -14;
      return {
        score: 80 + midLowCardBonus + marginAdjustment,
        isSafe: true,
        reason: `MID_ZONE(sum=${carrierSum})+CARD(${card},margin=${headroom})`,
      };
    }

    // [위험 구간: sum >= 11]
    // 0 카드가 있으면 최우선으로 조합하고, 1 카드(sum=11일 때 합 12)는 차선책으로 둔다.
    if (card === 0) {
      return {
        score: 135 + roundInHalf * 2,
        isSafe: true,
        reason: `DANGER_ZONE_ZERO_DEFENSE(sum=${carrierSum})`,
      };
    }

    return {
      score: 52 + card * 2,
      isSafe: true,
      reason: `DANGER_ZONE_TIGHT_SAFE(sum=${carrierSum})+CARD(${card})`,
    };
  }

  // 2) 현재 시점에서도 즉시 13 이상 폭발하는 조합 (sum + card >= 13)
  // 위험 구간(sum >= 11)이거나 안전 카드가 없는 상태이므로 우선순위를 크게 낮춘다.
  // 단, 어쩔 수 없이 내야 할 때는 (a) 쌓인 돌 개수(stonesCount)가 적은 곳, 또는 (b) 높은 숫자(5, 6)로 선순위를 잡아 패스 심리전을 노린다.
  const lowPenaltyScore = Math.max(0, 6 - stonesCount) * 8;
  const highPriorityEscapeBonus = card >= 5 ? card * 3.5 : card * 1.5;

  return {
    score: 10 + lowPenaltyScore + highPriorityEscapeBonus,
    isSafe: false,
    reason: `OVERLOAD_RISK(sum=${carrierSum},stones=${stonesCount})+CARD(${card})`,
  };
}

/**
 * 1. `decideBotSelection` (동시 선택 단계: 카드 1장 + 칩 1개 선택)
 * - 현재 3개 받침대(RED, GREEN, BLUE)의 sum과 stones.length, 보유 손패, 현재 라운드(전반/후반 진행도)를 평가한다.
 * - 일반 칩으로 안전하게 낼 수 있는 후보가 마땅치 않을 때만 RAINBOW 칩을 비상 탈출용으로 꺼낸다.
 * - 상위 후보 중 약 75% 확률로 1순위, 25% 확률로 2순위 후보를 선택해 인간미(Noise)를 부여한다.
 */
export function decideBotSelection(
  state: HostGameState,
  botPlayerId: string,
  rng: () => number = Math.random
): GameAction | null {
  const bot: Player | undefined = state.players.find(
    (p) => p.id === botPlayerId
  );
  if (
    !bot ||
    bot.hasSubmittedThisRound ||
    bot.cards.length === 0 ||
    bot.chips.length === 0
  ) {
    return null;
  }

  const uniqueCards = Array.from(new Set(bot.cards));
  const uniqueChips = Array.from(new Set(bot.chips));
  const normalChips = uniqueChips.filter(
    (c): c is CarrierColor => c !== 'RAINBOW'
  );
  const hasRainbow = uniqueChips.includes('RAINBOW');

  // 현재 반기(1~7R 또는 8~14R) 내에서의 라운드 진행도 (1 ~ 7)
  const roundInHalf = ((state.round - 1) % 7) + 1;

  const candidates: ScoredSelectionCandidate[] = [];

  // A. 일반 색깔 칩(RED, GREEN, BLUE) 후보 점수 계산
  for (const chipColor of normalChips) {
    const pillar = state.carriers[chipColor];
    for (const card of uniqueCards) {
      const evaluated = scoreNormalChipCardCombo(
        pillar.sum,
        pillar.stones.length,
        card,
        roundInHalf
      );
      candidates.push({
        chip: chipColor,
        card,
        score: evaluated.score,
        isSafe: evaluated.isSafe,
        reason: evaluated.reason,
      });
    }
  }

  // 일반 칩으로 안전하게 낼 수 있는 양호한 선택지가 있는지 확인
  const comfortableNormalMoves = candidates.filter(
    (c) => c.isSafe && c.score >= 75
  );
  const anySafeNormalMove = candidates.some((c) => c.isSafe);

  // B. RAINBOW 칩 후보 점수 계산
  if (hasRainbow) {
    for (const card of uniqueCards) {
      // 3개 받침대 중 이 카드를 가장 유리하게 받아줄 수 있는 받침대 기준으로 평가
      const carrierEvals = CARRIER_COLORS.map((color) => {
        const pillar = state.carriers[color];
        return scoreNormalChipCardCombo(
          pillar.sum,
          pillar.stones.length,
          card,
          roundInHalf
        );
      });
      const bestCarrierEval = carrierEvals.sort((a, b) => b.score - a.score)[0];

      let rainbowScore = bestCarrierEval.score;

      if (!anySafeNormalMove) {
        // 일반 칩으로는 어느 곳도 안전하지 않을 때: RAINBOW 비상 탈출 가중치 대폭 부여 + 고숫자 처리 선호
        rainbowScore += 45 + card * 4;
      } else if (comfortableNormalMoves.length === 0) {
        // 일반 칩이 모두 아슬아슬한 위험 구간일 때: RAINBOW 사용 적극 허용
        rainbowScore += 20 + card * 3;
      } else if (roundInHalf >= 6) {
        // 전반부(6~7R) 또는 후반부(13~14R) 막바지에는 남은 RAINBOW 칩을 아끼지 않고 고숫자와 함께 소진
        rainbowScore += 12 + card * 3;
      } else {
        // 일반 칩으로 안전한 여유 공간이 충분할 때: RAINBOW 칩을 아끼기 위해 가중치를 낮게 유지
        rainbowScore -= 42;
      }

      candidates.push({
        chip: 'RAINBOW',
        card,
        score: rainbowScore,
        isSafe: bestCarrierEval.isSafe,
        reason: `RAINBOW_EVAL(${bestCarrierEval.reason})`,
      });
    }
  }

  if (candidates.length === 0) {
    return {
      type: 'LOCK_IN_SELECTION',
      playerId: botPlayerId,
      card: bot.cards[0],
      chip: bot.chips[0],
    };
  }

  // 점수 내림차순 정렬 (동점 시 높은 숫자 카드 우선)
  const sortedCandidates = [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.card - a.card;
  });

  // 인간미(Noise) 부여: 상위 후보 중 75% 확률로 1순위, 25% 확률로 2순위(또는 3순위) 선택
  let chosen = sortedCandidates[0];
  if (sortedCandidates.length >= 2 && rng() >= BOT_TOP_CHOICE_PROBABILITY) {
    const secondIndex =
      sortedCandidates.length >= 3 && rng() < 0.3 ? 2 : 1;
    chosen = sortedCandidates[secondIndex] ?? sortedCandidates[0];
  }

  return {
    type: 'LOCK_IN_SELECTION',
    playerId: botPlayerId,
    card: chosen.card,
    chip: chosen.chip,
  };
}

/**
 * 2. `decideBotPlacementAction` (배치 단계: 즉시 배치 vs 패스 vs 레인보우 대상 선택)
 * - 이미 공개된 전원의 칩/카드(`state.submissions`)와 아직 배치하지 않은 뒷순서 대기열(`state.turnQueue`)을 분석한다.
 * - RAINBOW 칩: 안전한 받침대(sum + card < 13) 중 현재 합계(sum)가 가장 높은 곳을 선택해 뒷사람을 압박하고,
 *   3곳 모두 폭발한다면 쌓인 돌 개수(stones.length)가 가장 적은 받침대를 선택해 벌점을 최소화한다.
 * - 패스('PASS') 판단:
 *   - 폭발하지 않는 안전 배치(sum + card < 13)라면 무조건 즉시 'PLACE'한다.
 *   - 폭발(sum + card >= 13) 상황이고 이번 라운드 패스 가능 시:
 *     1) 뒤에 아직 차례가 남은 플레이어(`turnQueue.slice(1)`) 중 같은 색 받침대에 놓을 가능성(동일 색 칩 또는 RAINBOW 칩)이 있는 사람이 전혀 없다면,
 *        LIFO 역순 패스를 써도 결국 본인이 폭발을 떠안게 되므로 패스하지 않고 즉시 'PLACE'한다.
 *     2) 현재 대상 받침대의 돌 개수(`stones.length`)가 1개뿐이라면(벌점 1점), 40% 확률로 패스를 아끼지 않고 1점 손절 'PLACE'를 선택한다.
 *     3) 뒤에 같은 색(또는 RAINBOW) 경쟁자가 남아 있다면 80% 확률로 'PASS'하여 앞사람이 먼저 터뜨리기를 유도한다.
 */
export function decideBotPlacementAction(
  state: HostGameState,
  botPlayerId: string,
  rng: () => number = Math.random
): BotPlacementDecision {
  const submission = state.submissions[botPlayerId];
  const passAvailable = canPlayerPass(state, botPlayerId);

  if (!submission) {
    return {
      action: 'PLACE',
      targetColor: 'RED',
      reason: 'FALLBACK_NO_SUBMISSION',
    };
  }

  const { chip: myChip, card: myCardValue } = submission;

  // 1) 대상 받침대(targetColor) 결정
  let targetColor: CarrierColor;

  if (myChip === 'RAINBOW') {
    const safeCarriers = CARRIER_COLORS.filter(
      (color) => state.carriers[color].sum + myCardValue < EXPLOSION_THRESHOLD
    );

    if (safeCarriers.length > 0) {
      // 안전한 받침대가 여러 곳이면 현재 sum이 가장 높은 곳에 올려 뒷순서 플레이어를 압박
      const sortedSafe = [...safeCarriers].sort((a, b) => {
        const sumDiff = state.carriers[b].sum - state.carriers[a].sum;
        if (sumDiff !== 0) return sumDiff;
        return (
          state.carriers[b].stones.length - state.carriers[a].stones.length
        );
      });
      targetColor = sortedSafe[0];
    } else {
      // 3곳 모두 13 이상 폭발한다면 쌓여 있는 돌 개수(stones.length)가 가장 적은 받침대를 선택해 벌점 최소화
      const sortedLeastPenalty = [...CARRIER_COLORS].sort((a, b) => {
        const stoneDiff =
          state.carriers[a].stones.length - state.carriers[b].stones.length;
        if (stoneDiff !== 0) return stoneDiff;
        return state.carriers[a].sum - state.carriers[b].sum;
      });
      targetColor = sortedLeastPenalty[0];
    }
  } else {
    targetColor = myChip;
  }

  const targetPillar = state.carriers[targetColor];
  const projectedSum = targetPillar.sum + myCardValue;
  const causesOverload = projectedSum >= EXPLOSION_THRESHOLD;

  // 2) 폭발하지 않는 안전한 배치(sum + myCardValue < 13)라면 무조건 즉시 'PLACE'
  if (!causesOverload) {
    return {
      action: 'PLACE',
      targetColor,
      reason: `SAFE_PLACE(${targetColor}:${targetPillar.sum}+${myCardValue}=${projectedSum})`,
    };
  }

  // 3) 폭발하는 상황(sum + myCardValue >= 13)이지만 이미 패스를 썼거나 역순 배치 차례여서 패스 불가한 경우 즉시 'PLACE'
  if (!passAvailable) {
    return {
      action: 'PLACE',
      targetColor,
      reason: `FORCED_OVERLOAD_NO_PASS(${targetColor}:stones=${targetPillar.stones.length})`,
    };
  }

  // 4) 패스 유효성 확인:
  // 패스(LIFO 역순 후배치)를 선언했을 때 나보다 먼저 배치하게 될 뒷순서 플레이어(`state.turnQueue.slice(1)`) 중
  // 같은 색깔 받침대에 돌을 놓을 가능성이 있는 플레이어(같은 색 칩 또는 RAINBOW 칩 제출자)가 남아 있는지 확인한다.
  // (만약 내 칩이 RAINBOW이고 3곳 모두 폭발 상태라면, 뒷사람 중 누구든 어느 받침대라도 먼저 터뜨려 주면 그곳으로 피할 수 있으므로 경쟁자로 인정)
  const upcomingPlayerIds = state.turnQueue.slice(1);
  const hasCompetitorForTarget = upcomingPlayerIds.some((otherId) => {
    const otherSub = state.submissions[otherId];
    if (!otherSub) return false;
    if (myChip === 'RAINBOW') {
      return true;
    }
    return otherSub.chip === targetColor || otherSub.chip === 'RAINBOW';
  });

  // 뒤에 같은 색 칩(또는 RAINBOW)을 낸 사람이 전혀 없고 나 혼자만 남았다면:
  // LIFO 역순 패스를 써도 결국 내가 제일 먼저(혹은 혼자) 해당 받침대에 놓아 폭발하므로 패스하지 않고 즉시 'PLACE' (손절)
  if (!hasCompetitorForTarget) {
    return {
      action: 'PLACE',
      targetColor,
      reason: `NO_COMPETITOR_BEHIND_CUT_LOSS(${targetColor}:stones=${targetPillar.stones.length})`,
    };
  }

  // 5) 저벌점 손절 판단:
  // 폭발하더라도 현재 해당 받침대의 돌 개수(stones.length)가 1개뿐이라면(벌점 1점),
  // 약 40% 확률로 굳이 패스를 쓰지 않고 1점만 받고 즉시 넘기는 판단을 섞는다.
  if (
    targetPillar.stones.length <= 1 &&
    rng() < BOT_LOW_PENALTY_ACCEPT_PROBABILITY
  ) {
    return {
      action: 'PLACE',
      targetColor,
      reason: `ACCEPT_1PT_PENALTY(${targetColor}:stones=${targetPillar.stones.length})`,
    };
  }

  // 6) 뒤에 같은 색 받침대 경쟁자가 남아 있다면 약 80% 확률로 'PASS' 선택
  if (rng() < BOT_PASS_ON_OVERLOAD_PROBABILITY) {
    return {
      action: 'PASS',
      targetColor,
      reason: `STRATEGIC_PASS_ON_OVERLOAD(${targetColor}:${targetPillar.sum}+${myCardValue}=${projectedSum})`,
    };
  }

  return {
    action: 'PLACE',
    targetColor,
    reason: `SUBOPTIMAL_OVERLOAD_PLACE(${targetColor}:stones=${targetPillar.stones.length})`,
  };
}

/**
 * `decideBotPlacementAction`의 결정을 엔진 리듀서용 `GameAction`으로 변환한다.
 */
export function decideBotPlacement(
  state: HostGameState,
  botPlayerId: string,
  rng: () => number = Math.random
): GameAction {
  const decision = decideBotPlacementAction(state, botPlayerId, rng);

  if (decision.action === 'PASS') {
    return {
      type: 'PASS_TURN',
      playerId: botPlayerId,
    };
  }

  return {
    type: 'EXECUTE_PLACEMENT',
    playerId: botPlayerId,
    targetCarrier: decision.targetColor,
  };
}

/**
 * 현재 라운드 페이즈(`SELECTION`, `REVEAL_CHIPS`, `REVEAL_CARDS`, `PLACEMENT`)에 맞춰
 * AI 봇들의 선택/배치 및 공개 단계 자동 진행 타이머를 스케줄링하고,
 * 언마운트/상태 갱신 시 모든 타이머를 안전하게 해제하는 클린업 함수를 반환한다.
 */
export function scheduleRoundAutomation(
  state: HostGameState,
  dispatch: (action: GameAction) => void,
  rng: () => number = Math.random
): () => void {
  if (state.phase !== 'PLAYING') {
    return () => {};
  }

  const timerIds: ReturnType<typeof globalThis.setTimeout>[] = [];
  let isCancelled = false;

  const clearAll = () => {
    isCancelled = true;
    for (const id of timerIds) {
      globalThis.clearTimeout(id);
    }
  };

  // 1) SELECTION 단계: 아직 제출하지 않은 모든 AI 봇에 대해 0.5초 ~ 1.45초 내 개별 제출 예약
  if (state.roundPhase === 'SELECTION') {
    const unsubmittedBots = state.players.filter(
      (p) => p.isBot && !p.hasSubmittedThisRound
    );

    for (const bot of unsubmittedBots) {
      const delayMs =
        Math.floor(
          rng() * (BOT_SELECTION_MAX_DELAY_MS - BOT_SELECTION_MIN_DELAY_MS + 1)
        ) + BOT_SELECTION_MIN_DELAY_MS;

      const tId = globalThis.setTimeout(() => {
        if (isCancelled) return;
        const action = decideBotSelection(state, bot.id, rng);
        if (action) {
          dispatch(action);
        }
      }, delayMs);

      timerIds.push(tId);
    }
    return clearAll;
  }

  // 2) REVEAL_CHIPS 단계: 약 1.7초간 색깔 칩 공개 연출 후 자동으로 REVEAL_CARDS로 전환
  if (state.roundPhase === 'REVEAL_CHIPS') {
    const tId = globalThis.setTimeout(() => {
      if (isCancelled) return;
      dispatch({ type: 'ADVANCE_REVEAL_PHASE' });
    }, 1700);
    timerIds.push(tId);
    return clearAll;
  }

  // 3) REVEAL_CARDS 단계: 약 1.9초간 바위 카드 및 정렬된 배치 순서 공개 연출 후 PLACEMENT로 전환
  if (state.roundPhase === 'REVEAL_CARDS') {
    const tId = globalThis.setTimeout(() => {
      if (isCancelled) return;
      dispatch({ type: 'ADVANCE_REVEAL_PHASE' });
    }, 1900);
    timerIds.push(tId);
    return clearAll;
  }

  // 4) PLACEMENT 단계: 현재 배치 차례인 플레이어가 AI 봇이면 0.8초 ~ 1.4초 후 배치 또는 패스 실행
  if (state.roundPhase === 'PLACEMENT') {
    const currentPlayer = state.players.find(
      (p) => p.id === state.currentTurnPlayerId
    );
    if (currentPlayer && currentPlayer.isBot) {
      const delayMs =
        Math.floor(
          rng() * (BOT_PLACEMENT_MAX_DELAY_MS - BOT_PLACEMENT_MIN_DELAY_MS + 1)
        ) + BOT_PLACEMENT_MIN_DELAY_MS;

      const tId = globalThis.setTimeout(() => {
        if (isCancelled) return;
        const action = decideBotPlacement(state, currentPlayer.id, rng);
        dispatch(action);
      }, delayMs);

      timerIds.push(tId);
    }
  }

  return clearAll;
}
