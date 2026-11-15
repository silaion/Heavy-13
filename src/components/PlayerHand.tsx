// src/components/PlayerHand.tsx
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Send,
  SkipForward,
  Target,
} from 'lucide-react';
import type { CarrierColor, ChipColor, RockCard } from '../types/game';
import {
  CARRIER_COLORS,
  EXPLOSION_THRESHOLD,
  resolveTargetCarrier,
} from '../engine/rules';
import { useTranslation } from '../i18n/useTranslation';
import { useGameStore } from '../store/useGameStore';

const ALL_CHIP_COLORS: readonly ChipColor[] = [
  'RED',
  'GREEN',
  'BLUE',
  'RAINBOW',
];

const CHIP_STYLES: Record<
  ChipColor,
  { ring: string; bg: string; text: string }
> = {
  RED: {
    ring: 'border-red-500/80',
    bg: 'bg-red-600/25 hover:bg-red-600/35',
    text: 'text-red-200',
  },
  GREEN: {
    ring: 'border-green-500/80',
    bg: 'bg-green-600/25 hover:bg-green-600/35',
    text: 'text-green-200',
  },
  BLUE: {
    ring: 'border-blue-500/80',
    bg: 'bg-blue-600/25 hover:bg-blue-600/35',
    text: 'text-blue-200',
  },
  RAINBOW: {
    ring: 'border-amber-400',
    bg: 'bg-gradient-to-r from-red-500/35 via-green-500/35 to-blue-500/35 hover:opacity-95',
    text: 'text-amber-100',
  },
};

const TARGET_CARRIER_STYLES: Record<
  CarrierColor,
  {
    activeClass: string;
    idleClass: string;
  }
> = {
  RED: {
    activeClass:
      'bg-red-600 text-white border-white shadow-lg shadow-red-600/30',
    idleClass:
      'bg-red-950/50 text-red-200 border-red-500/50 hover:bg-red-900/60',
  },
  GREEN: {
    activeClass:
      'bg-green-600 text-white border-white shadow-lg shadow-green-600/30',
    idleClass:
      'bg-green-950/50 text-green-200 border-green-500/50 hover:bg-green-900/60',
  },
  BLUE: {
    activeClass:
      'bg-blue-600 text-white border-white shadow-lg shadow-blue-600/30',
    idleClass:
      'bg-blue-950/50 text-blue-200 border-blue-500/50 hover:bg-blue-900/60',
  },
};

export function PlayerHand() {
  const { t, tColor, tChipBadge, tPlayerName, tError } = useTranslation();

  const viewState = useGameStore((s) => s.viewState);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const selectedCard = useGameStore((s) => s.selectedCard);
  const selectedChip = useGameStore((s) => s.selectedChip);
  const selectedTargetCarrier = useGameStore((s) => s.selectedTargetCarrier);
  const lastActionError = useGameStore((s) => s.lastActionError);
  const selectCard = useGameStore((s) => s.selectCard);
  const selectChip = useGameStore((s) => s.selectChip);
  const selectTargetCarrier = useGameStore((s) => s.selectTargetCarrier);
  const lockInSelection = useGameStore((s) => s.lockInSelection);
  const confirmPlacement = useGameStore((s) => s.confirmPlacement);
  const passTurn = useGameStore((s) => s.passTurn);

  if (!viewState || viewState.phase !== 'PLAYING') {
    return null;
  }

  const { roundPhase, players, submissions, currentTurnPlayerId, turnQueue } =
    viewState;

  const meSummary = players.find((p) => p.id === myPlayerId);
  const currentTurnPlayer = players.find((p) => p.id === currentTurnPlayerId);
  const mySubmission = submissions[myPlayerId];
  const hasLockedIn = Boolean(
    meSummary?.hasSubmittedThisRound || mySubmission?.hasSubmitted
  );
  const submittedCount = players.filter((p) => p.hasSubmittedThisRound).length;

  const isSelectionPhase = roundPhase === 'SELECTION';
  const isPlacementPhase = roundPhase === 'PLACEMENT';
  const isMyPlacementTurn =
    isPlacementPhase && currentTurnPlayerId === myPlayerId;
  const isInteractiveActionTurn =
    (isSelectionPhase && !hasLockedIn) || isMyPlacementTurn;

  const myCards = viewState.myHand.cards;
  const myChips = viewState.myHand.chips;

  // 색상별 보유 칩 개수 집계 (4열 균등 버튼으로 렌더링하여 모바일 줄바꿈 방지)
  const chipCounts: Record<ChipColor, number> = {
    RED: 0,
    GREEN: 0,
    BLUE: 0,
    RAINBOW: 0,
  };
  for (const c of myChips) {
    chipCounts[c] += 1;
  }

  const canPass =
    isMyPlacementTurn &&
    Boolean(
      meSummary && !meSummary.hasPassedThisRound && !meSummary.hasActedThisRound
    ) &&
    turnQueue.length > 0 &&
    turnQueue[0] === myPlayerId;

  // 현재 단계에서 유효한 카드/칩/받침대 계산
  const effectiveChip: ChipColor | null = isSelectionPhase
    ? hasLockedIn
      ? (mySubmission?.chip ?? null)
      : selectedChip
    : (mySubmission?.chip ?? null);

  const effectiveCard: RockCard | null = isSelectionPhase
    ? hasLockedIn
      ? (mySubmission?.card ?? null)
      : selectedCard
    : (mySubmission?.card ?? null);

  const activeTargetCarrier: CarrierColor | null = effectiveChip
    ? resolveTargetCarrier(effectiveChip, selectedTargetCarrier ?? undefined)
    : null;

  const targetPillar = activeTargetCarrier
    ? viewState.carriers[activeTargetCarrier]
    : null;

  const targetPillarSum = targetPillar ? targetPillar.sum : null;
  const targetPillarStonesCount = targetPillar ? targetPillar.stones.length : 0;

  const projectedSum =
    effectiveCard !== null && targetPillarSum !== null
      ? targetPillarSum + effectiveCard
      : null;

  const willExplode =
    projectedSum !== null && projectedSum >= EXPLOSION_THRESHOLD;

  const localizedActionError = tError(lastActionError);

  const getHeaderPrompt = (): string => {
    if (isSelectionPhase) {
      return hasLockedIn
        ? t('selectionPromptLocked', { submittedCount })
        : t('selectionPromptPending');
    }
    if (roundPhase === 'REVEAL_CHIPS' || roundPhase === 'REVEAL_CARDS') {
      return t('revealWaitPrompt');
    }
    if (isPlacementPhase) {
      if (isMyPlacementTurn) {
        return t('placementMyTurnPrompt');
      }
      return t('placementOtherTurnPrompt', {
        playerName: currentTurnPlayer
          ? tPlayerName(currentTurnPlayer)
          : 'Player',
      });
    }
    return t('revealWaitPrompt');
  };

  return (
    <section className="shrink-0 w-full max-w-full lg:max-w-7xl mx-auto px-2 sm:px-5 pt-0.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] overflow-x-hidden">
      <div
        className={`rounded-2xl border p-2.5 sm:p-3.5 transition-all space-y-2 ${
          isMyPlacementTurn
            ? 'ring-2 ring-amber-400 border-amber-400 bg-zinc-900/95 shadow-2xl shadow-amber-500/20'
            : isInteractiveActionTurn
              ? 'ring-1 ring-amber-400/70 border-amber-400/80 bg-zinc-900/95 shadow-xl shadow-amber-500/10'
              : 'border-zinc-800 bg-zinc-900/80 opacity-95'
        }`}
      >
        {/* 상단 상태 안내 및 턴 프롬프트 문구 (text-sm sm:text-base font-semibold) */}
        <div className="flex flex-wrap items-center justify-between gap-2 leading-tight">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isInteractiveActionTurn
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-zinc-600'
              }`}
            />
            <h3 className="text-sm sm:text-base font-semibold text-white truncate">
              {getHeaderPrompt()}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 max-w-full overflow-hidden">
            {/* 이미 비밀 제출을 완료한 경우: 이번 라운드 내 제출 조합 요약 */}
            {hasLockedIn &&
              mySubmission &&
              mySubmission.chip !== null &&
              mySubmission.card !== null && (
                <div className="rounded-xl border border-sky-500/40 bg-zinc-950/90 px-2.5 py-1 flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span
                    className={`px-2 py-0.5 rounded border text-xs sm:text-sm font-bold ${CHIP_STYLES[mySubmission.chip].ring} ${CHIP_STYLES[mySubmission.chip].bg} ${CHIP_STYLES[mySubmission.chip].text}`}
                  >
                    {tColor(mySubmission.chip)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-900 border border-stone-400 font-serif font-extrabold text-sm">
                    {mySubmission.card}
                  </span>
                </div>
              )}

            {projectedSum !== null &&
              activeTargetCarrier &&
              targetPillarSum !== null &&
              effectiveCard !== null && (
                <div
                  className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-bold border whitespace-nowrap truncate ${
                    willExplode
                      ? 'border-red-500/60 bg-red-950/60 text-red-200'
                      : 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                  }`}
                >
                  {tColor(activeTargetCarrier)}: {targetPillarSum}+{effectiveCard}
                  ={projectedSum}{' '}
                  {willExplode
                    ? `💥(-${targetPillarStonesCount})`
                    : t('projectedStatusSafe')}
                </div>
              )}
          </div>
        </div>

        {/* 에러 알림 */}
        {localizedActionError && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/50 px-3 py-2 flex items-center gap-2 text-sm text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="truncate">{localizedActionError}</span>
          </div>
        )}

        {/* PLACEMENT 단계에서 내 차례이고 RAINBOW 칩을 제출한 경우: 대상 받침대(RED/GREEN/BLUE) 선택 버튼 (text-sm sm:text-base font-bold, min-h-[44px]) */}
        {isMyPlacementTurn && mySubmission?.chip === 'RAINBOW' && (
          <div className="rounded-xl border border-amber-400/50 bg-zinc-950/90 p-2.5 space-y-2">
            <div className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-amber-300 leading-tight">
              <Target className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('rainbowTargetPrompt')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {CARRIER_COLORS.map((carrierColor) => {
                const isTarget = selectedTargetCarrier === carrierColor;
                const pillar = viewState.carriers[carrierColor];
                const targetStyle = TARGET_CARRIER_STYLES[carrierColor];

                return (
                  <button
                    key={carrierColor}
                    type="button"
                    onClick={() => selectTargetCarrier(carrierColor)}
                    className={`min-h-[44px] rounded-xl border-2 py-2 px-3 text-sm sm:text-base font-bold transition-all flex flex-col items-center justify-center cursor-pointer whitespace-nowrap truncate ${
                      isTarget ? targetStyle.activeClass : targetStyle.idleClass
                    }`}
                  >
                    <span className="truncate">{tColor(carrierColor)}</span>
                    <span className="text-xs sm:text-sm font-mono opacity-95 truncate">
                      {pillar.sum}/{EXPLOSION_THRESHOLD} (-{pillar.stones.length})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PLACEMENT 단계에서 내 차례일 때: [패스하기] & [바로 배치하기] 메인 액션 버튼 (text-sm sm:text-base font-bold, py-2.5 px-4, min-h-[44px]) */}
        {isMyPlacementTurn && mySubmission && mySubmission.card !== null && (
          <div className="grid grid-cols-12 gap-2">
            <button
              type="button"
              disabled={!canPass}
              onClick={() => passTurn()}
              className="col-span-5 sm:col-span-4 min-h-[44px] sm:min-h-[48px] rounded-xl border border-purple-500/50 bg-purple-500/15 hover:bg-purple-500/25 disabled:opacity-35 disabled:cursor-not-allowed py-2.5 px-4 text-sm sm:text-base font-bold text-purple-200 flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap truncate"
            >
              <SkipForward className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('passTurnBtn')}</span>
            </button>

            <button
              type="button"
              disabled={activeTargetCarrier === null}
              onClick={() => confirmPlacement()}
              className="col-span-7 sm:col-span-8 min-h-[44px] sm:min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 px-4 text-sm sm:text-base font-bold text-zinc-950 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer whitespace-nowrap truncate"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {activeTargetCarrier !== null
                  ? t('placeNowBtnActive', {
                      carrier: tColor(activeTargetCarrier),
                      card: mySubmission.card,
                    })
                  : t('placeNowBtnSelectTarget')}
              </span>
            </button>
          </div>
        )}

        {/* 보유 바위 카드(0~6) 7열 균등 그리드 & 보유 색깔 칩 4열 균등 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-center">
          {/* 1. 바위 카드 7장 (숫자: text-lg sm:text-xl font-extrabold, 높이: h-12 sm:h-14) */}
          <div className="lg:col-span-7 space-y-1">
            <div className="hidden sm:flex text-xs sm:text-sm font-bold text-zinc-300 items-center justify-between gap-2 leading-tight">
              <span className="whitespace-nowrap">
                {t('handCardsHeader', { count: myCards.length })}
              </span>
              <span className="text-xs sm:text-sm text-zinc-400 truncate">
                {activeTargetCarrier && targetPillarSum !== null
                  ? t('handCardsHintWithTarget', {
                      carrier: tColor(activeTargetCarrier),
                      sum: targetPillarSum,
                      stonesCount: targetPillarStonesCount,
                    })
                  : t('handCardsHintNoTarget')}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2 w-full">
              {myCards.map((card: RockCard, idx: number) => {
                const isSelected =
                  isSelectionPhase && !hasLockedIn && selectedCard === card;
                const causesBlast =
                  targetPillarSum !== null &&
                  targetPillarSum + card >= EXPLOSION_THRESHOLD;
                const canClickCard = isSelectionPhase && !hasLockedIn;

                return (
                  <button
                    key={`${card}-${idx}`}
                    type="button"
                    disabled={!canClickCard}
                    onClick={() => selectCard(isSelected ? null : card)}
                    className={`h-12 sm:h-14 rounded-xl border-2 px-0.5 flex flex-col items-center justify-center transition-all select-none ${
                      !canClickCard
                        ? 'border-stone-500/60 bg-stone-200/85 text-stone-900 opacity-75 cursor-default'
                        : isSelected
                          ? 'border-amber-400 bg-amber-400 text-zinc-950 font-black -translate-y-0.5 shadow-lg shadow-amber-500/30 cursor-pointer'
                          : causesBlast
                            ? 'border-red-500/60 bg-stone-900 text-red-300 hover:border-red-400 cursor-pointer'
                            : 'border-stone-400 bg-stone-200 text-stone-900 shadow-inner hover:bg-stone-100 cursor-pointer'
                    }`}
                  >
                    <span className="text-lg sm:text-xl font-serif font-extrabold leading-none">
                      {card}
                    </span>
                    {causesBlast && (
                      <span className="text-xs font-extrabold text-red-400 leading-none mt-0.5">
                        13!
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. 색깔 칩 4종 균등 그리드 (라벨 및 x2: text-xs sm:text-sm font-bold, min-h-[44px]) */}
          <div className="lg:col-span-5 space-y-1">
            <div className="hidden sm:flex text-xs sm:text-sm font-bold text-zinc-300 items-center justify-between gap-2 leading-tight">
              <span className="whitespace-nowrap">
                {t('handChipsHeader', { count: myChips.length })}
              </span>
              <span className="text-xs sm:text-sm text-zinc-400 truncate">
                {t('handChipsHint')}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 w-full">
              {ALL_CHIP_COLORS.map((chip: ChipColor) => {
                const count = chipCounts[chip];
                const playable =
                  isSelectionPhase && !hasLockedIn && count > 0;
                const isSelected =
                  isSelectionPhase && !hasLockedIn && selectedChip === chip;
                const style = CHIP_STYLES[chip];

                return (
                  <button
                    key={chip}
                    type="button"
                    disabled={!playable}
                    onClick={() => selectChip(isSelected ? null : chip)}
                    className={`min-h-[44px] px-1.5 py-1.5 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all flex flex-col items-center justify-center leading-tight select-none whitespace-nowrap overflow-hidden ${
                      count === 0
                        ? 'border-zinc-800/80 bg-zinc-950/30 text-zinc-600 opacity-40 cursor-not-allowed'
                        : !playable
                          ? 'border-zinc-800 bg-zinc-950/50 text-zinc-300 opacity-70 cursor-default'
                          : isSelected
                            ? 'border-white bg-white text-zinc-950 -translate-y-0.5 shadow-md cursor-pointer'
                            : `${style.ring} ${style.bg} ${style.text} cursor-pointer`
                    }`}
                  >
                    <div className="flex items-center gap-1 max-w-full truncate">
                      <span className="text-xs sm:text-sm font-bold truncate">
                        {tColor(chip)}
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-mono font-bold ${
                          isSelected ? 'text-zinc-800' : 'opacity-90'
                        }`}
                      >
                        x{count}
                      </span>
                    </div>
                    {chip !== 'RAINBOW' ? (
                      <span
                        className={`text-xs font-mono leading-none mt-0.5 ${
                          isSelected ? 'text-zinc-900' : 'opacity-85'
                        }`}
                      >
                        {t('chipCarrierSumShort', {
                          sum: viewState.carriers[chip].sum,
                        })}
                      </span>
                    ) : (
                      <span
                        className={`text-xs font-mono leading-none mt-0.5 ${
                          isSelected ? 'text-zinc-900' : 'opacity-85'
                        }`}
                      >
                        #1
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. SELECTION 단계: 비밀 제출(Lock-in) 메인 액션 버튼 (text-sm sm:text-base font-bold, py-2.5 px-4, min-h-[44px]) */}
        {isSelectionPhase && (
          <div>
            <button
              type="button"
              disabled={
                hasLockedIn || selectedCard === null || selectedChip === null
              }
              onClick={() => lockInSelection()}
              className="w-full min-h-[44px] sm:min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 px-4 text-sm sm:text-base font-bold text-zinc-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer whitespace-nowrap truncate"
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {hasLockedIn
                  ? t('lockInDoneBtn')
                  : selectedCard !== null && selectedChip !== null
                    ? t('lockInSelectionBtnActive', {
                        card: selectedCard,
                        chip: tChipBadge(selectedChip),
                      })
                    : t('lockInSelectionBtnDisabled')}
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
