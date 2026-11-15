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
  isChipPlayable,
  resolveTargetCarrier,
} from '../engine/rules';
import { useTranslation } from '../i18n/useTranslation';
import { useGameStore } from '../store/useGameStore';

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
    nameKey: 'carrierName_RED' | 'carrierName_GREEN' | 'carrierName_BLUE';
    activeClass: string;
    idleClass: string;
  }
> = {
  RED: {
    nameKey: 'carrierName_RED',
    activeClass: 'bg-red-600 text-white border-white shadow-lg shadow-red-600/30',
    idleClass:
      'bg-red-950/50 text-red-200 border-red-500/50 hover:bg-red-900/60',
  },
  GREEN: {
    nameKey: 'carrierName_GREEN',
    activeClass:
      'bg-green-600 text-white border-white shadow-lg shadow-green-600/30',
    idleClass:
      'bg-green-950/50 text-green-200 border-green-500/50 hover:bg-green-900/60',
  },
  BLUE: {
    nameKey: 'carrierName_BLUE',
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
    <section className="w-full max-w-6xl mx-auto px-3 sm:px-6 pb-6">
      <div
        className={`rounded-3xl border p-4 sm:p-5 transition-all space-y-4 ${
          isInteractiveActionTurn
            ? 'border-amber-400/70 bg-zinc-900/95 shadow-2xl shadow-amber-500/10'
            : 'border-zinc-800 bg-zinc-900/60 opacity-90'
        }`}
      >
        {/* 상단 안내 및 선택 받침대 예상 합계 프리뷰 */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isInteractiveActionTurn
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-zinc-600'
              }`}
            />
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              {getHeaderPrompt()}
            </h3>
          </div>

          {projectedSum !== null &&
            activeTargetCarrier &&
            targetPillarSum !== null &&
            effectiveCard !== null && (
              <div
                className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${
                  willExplode
                    ? 'border-red-500/60 bg-red-950/60 text-red-300'
                    : 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                }`}
              >
                {t('projectedSumPreview', {
                  carrier: tColor(activeTargetCarrier),
                  currentSum: targetPillarSum,
                  card: effectiveCard,
                  projectedSum,
                  status: willExplode
                    ? t('projectedStatusExplode', {
                        collectedCount: targetPillarStonesCount,
                      })
                    : t('projectedStatusSafe'),
                })}
              </div>
            )}
        </div>

        {/* 에러 알림 */}
        {localizedActionError && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/50 px-3.5 py-2 flex items-center gap-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{localizedActionError}</span>
          </div>
        )}

        {/* 이미 비밀 제출을 완료한 경우: 이번 라운드 내 제출 조합 요약 배너 */}
        {hasLockedIn &&
          mySubmission &&
          mySubmission.chip !== null &&
          mySubmission.card !== null && (
            <div className="rounded-2xl border border-sky-500/40 bg-zinc-950/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t('myLockedSubmissionLabel')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-lg border text-xs font-extrabold ${CHIP_STYLES[mySubmission.chip].ring} ${CHIP_STYLES[mySubmission.chip].bg} ${CHIP_STYLES[mySubmission.chip].text}`}
                >
                  {tChipBadge(mySubmission.chip)}
                </span>
                <span className="px-3 py-1 rounded-lg bg-stone-200 text-stone-900 border border-stone-400 font-serif font-extrabold text-sm">
                  {mySubmission.card}
                </span>
              </div>
            </div>
          )}

        {/* PLACEMENT 단계에서 내 차례이고 RAINBOW 칩을 제출한 경우: 대상 받침대(RED/GREEN/BLUE) 선택기 */}
        {isMyPlacementTurn && mySubmission?.chip === 'RAINBOW' && (
          <div className="rounded-2xl border border-amber-400/50 bg-zinc-950/90 p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300">
              <Target className="w-4 h-4" />
              <span>{t('rainbowTargetPrompt')}</span>
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
                    className={`rounded-xl border-2 py-2.5 px-3 text-xs font-extrabold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      isTarget ? targetStyle.activeClass : targetStyle.idleClass
                    }`}
                  >
                    <span>{t(targetStyle.nameKey)}</span>
                    <span className="text-[11px] font-mono opacity-90">
                      {t('rainbowTargetSub', {
                        sum: pillar.sum,
                        count: pillar.stones.length,
                      })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PLACEMENT 단계에서 내 차례일 때: [바로 배치하기] & [패스하기(1회)] 버튼 */}
        {isMyPlacementTurn && mySubmission && mySubmission.card !== null && (
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="button"
              disabled={!canPass}
              onClick={() => passTurn()}
              className="sm:w-56 rounded-xl border border-purple-500/50 bg-purple-500/15 hover:bg-purple-500/25 disabled:opacity-35 disabled:cursor-not-allowed py-3.5 px-4 text-xs sm:text-sm font-bold text-purple-200 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
              {t('passTurnBtn')}
            </button>

            <button
              type="button"
              disabled={activeTargetCarrier === null}
              onClick={() => confirmPlacement()}
              className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed py-3.5 px-6 text-xs sm:text-sm font-extrabold text-zinc-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {activeTargetCarrier !== null
                ? t('placeNowBtnActive', {
                    carrier: tColor(activeTargetCarrier),
                    card: mySubmission.card,
                  })
                : t('placeNowBtnSelectTarget')}
            </button>
          </div>
        )}

        {/* 1. 보유 바위 카드(0~6) 영역 */}
        <div className="space-y-1.5">
          <div className="text-xs font-bold text-zinc-400 flex items-center justify-between">
            <span>{t('handCardsHeader', { count: myCards.length })}</span>
            <span className="text-[11px] text-zinc-500">
              {activeTargetCarrier && targetPillarSum !== null
                ? t('handCardsHintWithTarget', {
                    carrier: tColor(activeTargetCarrier),
                    sum: targetPillarSum,
                    stonesCount: targetPillarStonesCount,
                  })
                : t('handCardsHintNoTarget')}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
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
                  className={`rounded-2xl border-2 py-3 sm:py-4 flex flex-col items-center justify-center transition-all select-none ${
                    !canClickCard
                      ? 'border-stone-500/60 bg-stone-200/80 text-stone-900 opacity-75 cursor-default'
                      : isSelected
                        ? 'border-amber-400 bg-amber-400 text-zinc-950 font-black -translate-y-1 shadow-lg shadow-amber-500/30 cursor-pointer'
                        : causesBlast
                          ? 'border-red-500/60 bg-stone-900 text-red-300 hover:border-red-400 cursor-pointer'
                          : 'border-stone-400 bg-stone-200 text-stone-900 shadow-inner hover:bg-stone-100 cursor-pointer'
                  }`}
                >
                  <span className="text-xl sm:text-2xl font-serif font-extrabold">
                    {card}
                  </span>
                  <span
                    className={`text-[10px] mt-0.5 font-bold ${
                      isSelected
                        ? 'text-zinc-900'
                        : causesBlast
                          ? 'text-red-400'
                          : 'text-stone-600'
                    }`}
                  >
                    {causesBlast
                      ? t('cardTileBlastLabel')
                      : t('cardTileNormalLabel')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 보유 색깔 칩 영역 */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-zinc-400 flex items-center justify-between">
            <span>{t('handChipsHeader', { count: myChips.length })}</span>
            <span className="text-[11px] text-zinc-500">
              {t('handChipsHint')}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {myChips.map((chip: ChipColor, idx: number) => {
              const playable =
                isSelectionPhase &&
                !hasLockedIn &&
                isChipPlayable(chip, myChips);
              const isSelected =
                isSelectionPhase && !hasLockedIn && selectedChip === chip;
              const style = CHIP_STYLES[chip];

              return (
                <button
                  key={`${chip}-${idx}`}
                  type="button"
                  disabled={!playable}
                  onClick={() => selectChip(isSelected ? null : chip)}
                  className={`px-3.5 py-2.5 rounded-xl border-2 text-xs font-extrabold transition-all flex items-center gap-1.5 select-none ${
                    !playable
                      ? 'border-zinc-800 bg-zinc-950/40 text-zinc-400 opacity-60 cursor-default'
                      : isSelected
                        ? 'border-white bg-white text-zinc-950 -translate-y-0.5 shadow-md cursor-pointer'
                        : `${style.ring} ${style.bg} ${style.text} cursor-pointer`
                  }`}
                >
                  <span>{tColor(chip)}</span>
                  {chip !== 'RAINBOW' && (
                    <span className="text-[10px] opacity-80 font-mono">
                      {t('chipCarrierSumShort', {
                        sum: viewState.carriers[chip].sum,
                      })}
                    </span>
                  )}
                  {isSelected && (
                    <span className="text-[10px] px-1 rounded bg-zinc-900 text-amber-300">
                      {t('selectedBadge')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. SELECTION 단계: 비밀 제출(Lock-in) 버튼 */}
        {isSelectionPhase && (
          <div className="pt-1">
            <button
              type="button"
              disabled={
                hasLockedIn || selectedCard === null || selectedChip === null
              }
              onClick={() => lockInSelection()}
              className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed py-3.5 px-6 text-xs sm:text-sm font-extrabold text-zinc-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              {hasLockedIn
                ? t('lockInDoneBtn')
                : selectedCard !== null && selectedChip !== null
                  ? t('lockInSelectionBtnActive', {
                      card: selectedCard,
                      chip: tChipBadge(selectedChip),
                    })
                  : t('lockInSelectionBtnDisabled')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
