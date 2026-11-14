// src/components/PlayerHand.tsx
import { AlertCircle, Send, SkipForward, Target } from 'lucide-react';
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
  const { t, tColor, tChipBadge, tError } = useTranslation();

  const viewState = useGameStore((s) => s.viewState);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const selectedCard = useGameStore((s) => s.selectedCard);
  const selectedChip = useGameStore((s) => s.selectedChip);
  const selectedTargetCarrier = useGameStore((s) => s.selectedTargetCarrier);
  const lastActionError = useGameStore((s) => s.lastActionError);
  const selectCard = useGameStore((s) => s.selectCard);
  const selectChip = useGameStore((s) => s.selectChip);
  const selectTargetCarrier = useGameStore((s) => s.selectTargetCarrier);
  const submitSelectedCombo = useGameStore((s) => s.submitSelectedCombo);
  const passTurn = useGameStore((s) => s.passTurn);

  if (!viewState || viewState.phase !== 'PLAYING') {
    return null;
  }

  const isMyTurn = viewState.currentTurnPlayerId === myPlayerId;
  const meSummary = viewState.players.find((p) => p.id === myPlayerId);
  const myCards = viewState.myHand.cards;
  const myChips = viewState.myHand.chips;

  const hasUnactedRegularPlayers = viewState.players.some(
    (p) => !p.hasActedThisRound && !p.hasPassedThisRound
  );
  const canPass =
    isMyTurn &&
    Boolean(
      meSummary && !meSummary.hasPassedThisRound && !meSummary.hasActedThisRound
    ) &&
    hasUnactedRegularPlayers;

  const activeTargetCarrier: CarrierColor | null = selectedChip
    ? resolveTargetCarrier(selectedChip, selectedTargetCarrier ?? undefined)
    : null;

  const targetPillarSum = activeTargetCarrier
    ? viewState.carriers[activeTargetCarrier].sum
    : null;

  const projectedSum =
    selectedCard !== null && targetPillarSum !== null
      ? targetPillarSum + selectedCard
      : null;

  const willExplode =
    projectedSum !== null && projectedSum >= EXPLOSION_THRESHOLD;

  const localizedActionError = tError(lastActionError);

  return (
    <section className="w-full max-w-6xl mx-auto px-3 sm:px-6 pb-6">
      <div
        className={`rounded-3xl border p-4 sm:p-5 transition-all space-y-4 ${
          isMyTurn
            ? 'border-amber-400/70 bg-zinc-900/95 shadow-2xl shadow-amber-500/10'
            : 'border-zinc-800 bg-zinc-900/60 opacity-85'
        }`}
      >
        {/* 상단 안내 및 선택 받침대 예상 합계 프리뷰 */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isMyTurn ? 'bg-amber-400 animate-ping' : 'bg-zinc-600'
              }`}
            />
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              {isMyTurn ? t('myTurnPrompt') : t('otherTurnPrompt')}
            </h3>
          </div>

          {projectedSum !== null &&
            activeTargetCarrier &&
            targetPillarSum !== null &&
            selectedCard !== null && (
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
                  card: selectedCard,
                  projectedSum,
                  status: willExplode
                    ? t('projectedStatusExplode')
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

        {/* 1. 바위 카드(0~6) 선택 영역 */}
        <div className="space-y-1.5">
          <div className="text-xs font-bold text-zinc-400 flex items-center justify-between">
            <span>{t('handCardsHeader', { count: myCards.length })}</span>
            <span className="text-[11px] text-zinc-500">
              {activeTargetCarrier && targetPillarSum !== null
                ? t('handCardsHintWithTarget', {
                    carrier: tColor(activeTargetCarrier),
                    sum: targetPillarSum,
                  })
                : t('handCardsHintNoTarget')}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
            {myCards.map((card: RockCard, idx: number) => {
              const isSelected = selectedCard === card;
              const causesBlast =
                targetPillarSum !== null &&
                targetPillarSum + card >= EXPLOSION_THRESHOLD;

              return (
                <button
                  key={`${card}-${idx}`}
                  type="button"
                  onClick={() => selectCard(isSelected ? null : card)}
                  className={`rounded-2xl border-2 py-3 sm:py-4 flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400 text-zinc-950 font-black -translate-y-1 shadow-lg shadow-amber-500/30'
                      : causesBlast
                        ? 'border-red-500/60 bg-stone-900 text-red-300 hover:border-red-400'
                        : 'border-stone-400 bg-stone-200 text-stone-900 shadow-inner hover:bg-stone-100'
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

        {/* 2. 색깔 칩 선택 영역 */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-zinc-400 flex items-center justify-between">
            <span>{t('handChipsHeader', { count: myChips.length })}</span>
            <span className="text-[11px] text-zinc-500">
              {t('handChipsHint')}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {myChips.map((chip: ChipColor, idx: number) => {
              const playable = isChipPlayable(chip, myChips);
              const isSelected = selectedChip === chip;
              const style = CHIP_STYLES[chip];

              return (
                <button
                  key={`${chip}-${idx}`}
                  type="button"
                  disabled={!playable}
                  onClick={() => selectChip(isSelected ? null : chip)}
                  className={`px-3.5 py-2.5 rounded-xl border-2 text-xs font-extrabold transition-all flex items-center gap-1.5 select-none ${
                    !playable
                      ? 'border-zinc-800 bg-zinc-950/40 text-zinc-600 opacity-40 cursor-not-allowed'
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

          {/* RAINBOW 칩 선택 시: RED, GREEN, BLUE 중 어느 받침대에 돌을 올릴지 지정하는 타겟 선택기 */}
          {selectedChip === 'RAINBOW' && (
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
                        isTarget
                          ? targetStyle.activeClass
                          : targetStyle.idleClass
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
        </div>

        {/* 3. 하단 제출 및 패스 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            disabled={!canPass}
            onClick={() => passTurn()}
            className="sm:w-48 rounded-xl border border-purple-500/50 bg-purple-500/15 hover:bg-purple-500/25 disabled:opacity-35 disabled:cursor-not-allowed py-3 px-4 text-xs sm:text-sm font-bold text-purple-200 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
            {t('passTurnBtn')}
          </button>

          <button
            type="button"
            disabled={
              !isMyTurn ||
              selectedCard === null ||
              selectedChip === null ||
              activeTargetCarrier === null
            }
            onClick={() => submitSelectedCombo()}
            className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed py-3.5 px-6 text-xs sm:text-sm font-extrabold text-zinc-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {selectedCard !== null &&
            selectedChip !== null &&
            activeTargetCarrier !== null
              ? t('submitComboBtnActive', {
                  carrier: tColor(activeTargetCarrier),
                  card: selectedCard,
                  chip: tChipBadge(selectedChip),
                })
              : t('submitComboBtnDisabled')}
          </button>
        </div>
      </div>
    </section>
  );
}
