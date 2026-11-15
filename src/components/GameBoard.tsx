// src/components/GameBoard.tsx
import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Check,
  Clock,
  Eye,
  History,
  ListOrdered,
  LogOut,
  RefreshCw,
  ShieldAlert,
  Skull,
  Sparkles,
  Trophy,
  User,
  X,
} from 'lucide-react';
import type {
  CarrierColor,
  CarrierStone,
  ChipColor,
  PlacementQueueItem,
  RoundPhase,
  SanitizedOpponent,
} from '../types/game';
import {
  CARRIER_COLORS,
  EXPLOSION_THRESHOLD,
  MAX_ROUNDS,
} from '../engine/rules';
import { useTranslation } from '../i18n/useTranslation';
import { useGameStore } from '../store/useGameStore';
import {
  playChipSelect,
  playOverload,
  playPass,
  playStonePlace,
  playTurnAlert,
} from '../utils/soundEffects';
import { LanguageSwitcher } from './LanguageSwitcher';
import { RuleButton, RuleModal } from './RuleModal';

export interface GameBoardProps {
  onLeaveRoom: () => void;
}

const PILLAR_THEME: Record<
  CarrierColor,
  {
    baseBg: string;
    baseBorder: string;
    topLedgeBg: string;
    shadowColor: string;
    figureFill: string;
  }
> = {
  RED: {
    baseBg: 'bg-red-600',
    baseBorder: 'border-red-400',
    topLedgeBg: 'bg-red-700',
    shadowColor: 'shadow-red-950/80',
    figureFill: 'text-red-950/65',
  },
  GREEN: {
    baseBg: 'bg-green-600',
    baseBorder: 'border-green-400',
    topLedgeBg: 'bg-green-700',
    shadowColor: 'shadow-green-950/65',
    figureFill: 'text-green-950/65',
  },
  BLUE: {
    baseBg: 'bg-blue-600',
    baseBorder: 'border-blue-400',
    topLedgeBg: 'bg-blue-700',
    shadowColor: 'shadow-blue-950/80',
    figureFill: 'text-blue-950/65',
  },
};

const CHIP_PILL_STYLE: Record<ChipColor, string> = {
  RED: 'bg-red-500/25 text-red-200 border-red-500/50',
  GREEN: 'bg-green-500/25 text-green-200 border-green-500/50',
  BLUE: 'bg-blue-500/25 text-blue-200 border-blue-500/50',
  RAINBOW:
    'bg-gradient-to-r from-red-500/40 via-amber-400/40 to-blue-500/40 text-amber-100 border-amber-400/70',
};

const CHIP_DOT_STYLE: Record<ChipColor, string> = {
  RED: 'bg-red-500 border-red-300',
  GREEN: 'bg-green-500 border-green-300',
  BLUE: 'bg-blue-500 border-blue-300',
  RAINBOW:
    'bg-gradient-to-r from-red-500 via-amber-400 to-blue-500 border-amber-200',
};

function AtlasCarrierSilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 110"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <polygon points="6,0 114,0 100,16 20,16" opacity="0.45" />
      <path d="M22 10 L32 10 L36 32 L46 38 L42 47 L24 37 Z" />
      <path d="M98 10 L88 10 L84 32 L74 38 L78 47 L96 37 Z" />
      <circle cx="60" cy="30" r="11.5" />
      <path d="M53 36 Q60 46 67 36 Z" />
      <path d="M40 36 L80 36 L73 68 L47 68 Z" />
      <path d="M46 66 L30 92 L45 102 L58 78 L66 78 L75 102 L90 92 L74 66 Z" />
      <rect x="18" y="99" width="84" height="9" rx="3" opacity="0.65" />
    </svg>
  );
}

function chunkStonesIntoRows(
  stones: readonly CarrierStone[]
): CarrierStone[][] {
  const rows: CarrierStone[][] = [];
  for (let i = 0; i < stones.length; i += 2) {
    rows.push(stones.slice(i, i + 2));
  }
  return rows;
}

export function GameBoard({ onLeaveRoom }: GameBoardProps) {
  const { t, tColor, tChipBadge, tPlayerName, tLog, tPhaseTitle } =
    useTranslation();

  const role = useGameStore((s) => s.role);
  const viewState = useGameStore((s) => s.viewState);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const proceedFromHalfTime = useGameStore((s) => s.proceedFromHalfTime);
  const resetToLobby = useGameStore((s) => s.resetToLobby);

  const lastExplosion = viewState?.lastExplosion ?? null;
  const [activeExplosionId, setActiveExplosionId] = useState<string | null>(
    null
  );
  const [isRuleModalOpen, setIsRuleModalOpen] = useState<boolean>(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [activeTooltipStoneId, setActiveTooltipStoneId] = useState<
    string | null
  >(null);

  // 이전 상태 비교용 Ref (초기 마운트 시 불필요한 사운드 재생 방지 및 P2P/봇 액션 동기화 사운드 트리거)
  const hasMountedRef = useRef<boolean>(false);
  const prevLatestLogIdRef = useRef<string | null>(
    viewState?.logs[viewState.logs.length - 1]?.id ?? null
  );
  const prevExplosionIdRef = useRef<string | null>(lastExplosion?.id ?? null);
  const prevTurnPlayerIdRef = useRef<string | null>(
    viewState?.currentTurnPlayerId ?? null
  );
  const prevPhaseRef = useRef<string | null>(viewState?.phase ?? null);
  const prevRoundPhaseRef = useRef<RoundPhase | null>(
    viewState?.roundPhase ?? null
  );

  useEffect(() => {
    if (!lastExplosion) return;
    setActiveExplosionId(lastExplosion.id);
    const timer = window.setTimeout(() => {
      setActiveExplosionId((prev) =>
        prev === lastExplosion.id ? null : prev
      );
    }, 1150);
    return () => window.clearTimeout(timer);
  }, [lastExplosion?.id]);

  // P2P 상태 동기화 기반 사운드 이펙트 트리거 (돌 안착, 패스, 13 폭발, 단계 전환, 내 턴 알림)
  useEffect(() => {
    if (!viewState) return;

    const latestLog = viewState.logs[viewState.logs.length - 1];
    const latestLogId = latestLog?.id ?? null;
    const currentExplosionId = viewState.lastExplosion?.id ?? null;
    const currentTurnId = viewState.currentTurnPlayerId;
    const currentPhase = viewState.phase;
    const currentRoundPhase = viewState.roundPhase;

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      prevLatestLogIdRef.current = latestLogId;
      prevExplosionIdRef.current = currentExplosionId;
      prevTurnPlayerIdRef.current = currentTurnId;
      prevPhaseRef.current = currentPhase;
      prevRoundPhaseRef.current = currentRoundPhase;
      if (
        currentPhase === 'PLAYING' &&
        (currentRoundPhase === 'SELECTION' ||
          (currentRoundPhase === 'PLACEMENT' && currentTurnId === myPlayerId))
      ) {
        playTurnAlert();
      }
      return;
    }

    // 1) 새로운 13 폭발 발생 시: 돌 착지음 + 폭발 경고음 재생
    if (
      currentExplosionId !== null &&
      currentExplosionId !== prevExplosionIdRef.current
    ) {
      const lastCard = viewState.lastSubmitted?.card ?? 6;
      playStonePlace(lastCard);
      playOverload();
    } else if (latestLog && latestLogId !== prevLatestLogIdRef.current) {
      // 2) 폭발이 아닌 일반 돌 제출 또는 턴 패스 발생 시
      if (latestLog.type === 'SUBMIT') {
        const cardVal =
          latestLog.params?.card ?? viewState.lastSubmitted?.card ?? 3;
        playStonePlace(cardVal);
      } else if (latestLog.type === 'PASS') {
        playPass();
      }
    }

    // 3) 칩 공개 / 카드 공개 단계 진입 시 경쾌한 클릭 효과음
    if (
      currentPhase === 'PLAYING' &&
      currentRoundPhase !== prevRoundPhaseRef.current &&
      (currentRoundPhase === 'REVEAL_CHIPS' ||
        currentRoundPhase === 'REVEAL_CARDS')
    ) {
      playChipSelect();
    }

    // 4) 동시 선택 단계 시작 또는 PLACEMENT에서 내 배치 차례가 되었을 때 차임벨 알림음 재생
    const becameSelectionPhase =
      currentPhase === 'PLAYING' &&
      currentRoundPhase === 'SELECTION' &&
      (prevRoundPhaseRef.current !== 'SELECTION' ||
        prevPhaseRef.current !== 'PLAYING');

    const becameMyPlacementTurn =
      currentPhase === 'PLAYING' &&
      currentRoundPhase === 'PLACEMENT' &&
      currentTurnId === myPlayerId &&
      (prevTurnPlayerIdRef.current !== myPlayerId ||
        prevRoundPhaseRef.current !== 'PLACEMENT');

    if (becameSelectionPhase || becameMyPlacementTurn) {
      window.setTimeout(() => {
        playTurnAlert();
      }, 140);
    }

    prevLatestLogIdRef.current = latestLogId;
    prevExplosionIdRef.current = currentExplosionId;
    prevTurnPlayerIdRef.current = currentTurnId;
    prevPhaseRef.current = currentPhase;
    prevRoundPhaseRef.current = currentRoundPhase;
  }, [viewState, myPlayerId]);

  if (!viewState) return null;

  const {
    round,
    half,
    phase,
    roundPhase,
    players,
    startPlayerId,
    submissions,
    placementQueue,
    currentTurnPlayerId,
    turnQueue,
    passedQueue,
    carriers,
    lastSubmitted,
    eliminatedPlayerIds,
    logs,
  } = viewState;

  const currentTurnPlayer = players.find((p) => p.id === currentTurnPlayerId);
  const startPlayer = players.find((p) => p.id === startPlayerId);
  const submittedCount = players.filter((p) => p.hasSubmittedThisRound).length;
  const isPassedTurnOrder =
    roundPhase === 'PLACEMENT' &&
    turnQueue.length === 0 &&
    passedQueue.length > 0;
  const latestLog = logs[logs.length - 1];

  const getPhaseDescription = (): string => {
    switch (roundPhase) {
      case 'SELECTION':
        return t('phaseDesc_SELECTION', { submittedCount });
      case 'REVEAL_CHIPS':
        return t('phaseDesc_REVEAL_CHIPS');
      case 'REVEAL_CARDS':
        return t('phaseDesc_REVEAL_CARDS');
      case 'PLACEMENT':
      case 'ROUND_END':
        return isPassedTurnOrder
          ? t('phaseDesc_PLACEMENT_PASSED')
          : t('phaseDesc_PLACEMENT_REGULAR');
    }
  };

  /**
   * 상단 7인 통합 현황판 & 배치 순서 큐 미니 배지
   * - 모바일 세로 뷰포트(360px~430px)에서는 2줄 그리드(grid-cols-4 sm:grid-cols-7 gap-1)로 4+3 배치하여 가로 스크롤 및 세로 공간 팽창을 방지한다.
   * - 모바일 미니 배지에는 핵심 정보(닉네임 4~5글자 truncate, 누적 벌점 -N, 제출 체크 ✓ 또는 공개된 칩/카드 [6])를 직관적으로 집약한다.
   */
  const renderCompactPlayerSlot = (
    p: SanitizedOpponent,
    queueItem?: PlacementQueueItem
  ) => {
    const isCurrentTurn =
      phase === 'PLAYING' &&
      roundPhase === 'PLACEMENT' &&
      p.id === currentTurnPlayerId;
    const isMe = p.id === myPlayerId;
    const isStarter = p.id === startPlayerId;
    const isEliminated = eliminatedPlayerIds.includes(p.id);
    const displayName = tPlayerName(p);
    const submission = submissions[p.id];

    return (
      <div
        key={p.id}
        className={`rounded-lg sm:rounded-xl border px-1.5 sm:px-2 py-1 sm:py-1.5 flex flex-col justify-between gap-0.5 sm:gap-1 transition-all min-w-0 overflow-hidden ${
          isEliminated
            ? 'border-red-500/60 bg-red-950/30 opacity-80'
            : isCurrentTurn
              ? 'border-amber-400 bg-amber-500/20 shadow-md shadow-amber-500/15 ring-1 sm:ring-2 ring-amber-400/70'
              : queueItem?.status === 'PLACED'
                ? 'border-emerald-500/35 bg-emerald-950/20 opacity-80'
                : queueItem?.status === 'PASSED'
                  ? 'border-purple-500/45 bg-purple-950/30'
                  : isMe
                    ? 'border-sky-400/65 bg-zinc-900/95'
                    : 'border-zinc-800 bg-zinc-900/75'
        }`}
      >
        {/* 1열: 순위(#1~#7) 또는 선(👑) + 닉네임(4~5글자 말줄임) */}
        <div className="flex items-center justify-between gap-1 min-w-0 leading-tight">
          <div className="flex items-center gap-1 min-w-0">
            {queueItem ? (
              <span
                className={`text-[10px] sm:text-xs font-black font-mono px-1 py-0.2 rounded shrink-0 ${
                  isCurrentTurn
                    ? 'bg-amber-400 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-200'
                }`}
              >
                #{queueItem.priorityOrder}
              </span>
            ) : isStarter ? (
              <span
                className="text-[11px] leading-none shrink-0"
                title={t('starterBadge')}
              >
                👑
              </span>
            ) : p.isBot ? (
              <Bot className="w-3 h-3 text-zinc-400 shrink-0 hidden sm:inline" />
            ) : (
              <User className="w-3 h-3 text-sky-400 shrink-0 hidden sm:inline" />
            )}

            {queueItem && isStarter && (
              <span
                className="text-[10px] leading-none shrink-0"
                title={t('starterBadge')}
              >
                👑
              </span>
            )}

            <span
              className={`font-bold text-xs sm:text-sm truncate ${
                isMe ? 'text-sky-300' : 'text-white'
              }`}
            >
              {displayName}
            </span>
          </div>

          {/* 누적 벌점 (-N) */}
          <span
            className={`px-1 py-0.2 rounded text-[10px] sm:text-xs font-mono font-extrabold whitespace-nowrap shrink-0 ${
              p.penaltyPoints > 0
                ? 'bg-red-500/25 text-red-200 border border-red-500/40'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {p.penaltyPoints > 0 ? `-${p.penaltyPoints}` : '0'}
          </span>
        </div>

        {/* 2열: 공개된 칩/카드 숫자([6]) 또는 제출 체크(✓) */}
        <div className="flex items-center justify-between gap-1 leading-tight pt-0.5">
          {queueItem ? (
            <>
              <div className="flex items-center gap-1 min-w-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full border shrink-0 sm:hidden ${CHIP_DOT_STYLE[queueItem.chip]}`}
                />
                <span
                  className={`hidden sm:inline text-xs font-extrabold px-1.5 py-0.5 rounded border truncate ${CHIP_PILL_STYLE[queueItem.chip]}`}
                >
                  {tColor(queueItem.chip)}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-stone-200 text-stone-900 border border-stone-400 font-serif font-black text-xs leading-tight shrink-0">
                  [{queueItem.card}]
                </span>
              </div>

              <span
                className={`text-[10px] sm:text-xs font-extrabold truncate ${
                  isCurrentTurn
                    ? 'text-amber-300 animate-pulse'
                    : queueItem.status === 'PLACED'
                      ? 'text-emerald-300'
                      : queueItem.status === 'PASSED'
                        ? 'text-purple-300'
                        : 'text-zinc-400'
                }`}
              >
                {isCurrentTurn
                  ? t('queueStatusActive')
                  : queueItem.status === 'PLACED'
                    ? '✓'
                    : queueItem.status === 'PASSED'
                      ? t('passWaitingBadge')
                      : '·'}
              </span>
            </>
          ) : submission && submission.hasSubmitted ? (
            <>
              <div className="flex items-center gap-1 min-w-0">
                {submission.chip ? (
                  <>
                    <span
                      className={`w-2.5 h-2.5 rounded-full border shrink-0 sm:hidden ${CHIP_DOT_STYLE[submission.chip]}`}
                    />
                    <span
                      className={`text-[10px] sm:text-xs font-extrabold px-1 py-0.2 rounded border truncate ${CHIP_PILL_STYLE[submission.chip]}`}
                    >
                      {tColor(submission.chip)}
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] sm:text-xs font-extrabold text-emerald-300 flex items-center gap-0.5 truncate">
                    <Check className="w-3 h-3 shrink-0 stroke-[3]" />
                    <span className="hidden sm:inline">
                      {t('selectionDoneBadge')}
                    </span>
                  </span>
                )}
              </div>

              <span
                className={`px-1.5 py-0.2 rounded font-mono font-extrabold text-[11px] sm:text-xs shrink-0 ${
                  submission.card !== null
                    ? 'bg-stone-200 text-stone-900 border border-stone-400'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {submission.card !== null ? `[${submission.card}]` : '✓'}
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 flex items-center gap-0.5 truncate">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                <span className="truncate">{t('selectionSelectingBadge')}</span>
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-zinc-400 shrink-0">
                {p.remainingCards}
              </span>
            </>
          )}
        </div>
      </div>
    );
  };

  /**
   * 받침대 위에 쌓이는 개별 돌(Stone Cube) 셀
   * - 모바일 반응형 크기: aspect-square w-full max-w-[44px] sm:max-w-[56px]
   * - 숫자 크기: text-base sm:text-xl font-black 중앙 배치
   * - 제출자 표시: 짧은 2~3글자 이니셜 배지 + 탭(Tap) 시 툴팁 오버레이 표시
   */
  const renderStoneCell = (
    stone: CarrierStone | undefined,
    isExplodingNow: boolean,
    pillarColor: CarrierColor
  ) => {
    if (!stone) {
      return (
        <div className="aspect-square w-full max-w-[44px] sm:max-w-[56px]" />
      );
    }
    const ownerName = tPlayerName({
      id: stone.playerId,
      name: stone.playerName,
    });
    const shortInitial = ownerName.slice(0, 3);
    const chipLabel = tChipBadge(stone.chipColor);
    const isTooltipOpen = activeTooltipStoneId === stone.id;

    // 360px 화면 좌/우 가장자리 잘림 방지를 위한 툴팁 수평 정렬 위치
    const tooltipAlignClass =
      pillarColor === 'RED'
        ? 'left-0'
        : pillarColor === 'BLUE'
          ? 'right-0'
          : 'left-1/2 -translate-x-1/2';

    return (
      <button
        key={stone.id}
        type="button"
        onClick={() => {
          playChipSelect();
          setActiveTooltipStoneId((prev) =>
            prev === stone.id ? null : stone.id
          );
        }}
        title={t('stoneTileTooltip', { playerName: ownerName, chip: chipLabel })}
        className={`aspect-square w-full max-w-[44px] sm:max-w-[56px] rounded-lg border-2 flex flex-col items-center justify-center relative animate-stone-drop px-0.5 cursor-pointer select-none ${
          isExplodingNow
            ? 'bg-red-500 text-white border-red-200 ring-2 ring-red-400 animate-pulse'
            : isTooltipOpen
              ? 'bg-amber-200 text-stone-950 border-amber-500 ring-2 ring-amber-400'
              : 'bg-stone-200 text-stone-900 border-stone-400 shadow-inner'
        }`}
      >
        <span className="text-base sm:text-xl font-serif font-black leading-none tracking-tight">
          {stone.value}
        </span>
        <span
          className={`text-[10px] sm:text-xs font-extrabold truncate max-w-full leading-none mt-0.5 ${
            isExplodingNow ? 'text-red-100' : 'text-stone-700'
          }`}
        >
          {shortInitial}
        </span>
        {stone.chipColor === 'RAINBOW' && (
          <span
            className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-blue-500 ring-1 ring-stone-700"
            title={t('rainbowStoneTooltip')}
          />
        )}

        {/* 모바일 탭(Tap) 시 나타나는 제출자/칩 툴팁 배지 */}
        {isTooltipOpen && (
          <div
            className={`absolute -top-8 ${tooltipAlignClass} z-30 rounded-md bg-zinc-950/95 border border-amber-400/80 px-2 py-0.5 text-[11px] font-bold text-amber-200 whitespace-nowrap shadow-xl pointer-events-none`}
          >
            {ownerName} · {chipLabel}
          </div>
        )}
      </button>
    );
  };

  const renderCarrierPillar = (color: CarrierColor) => {
    const pillar = carriers[color];
    const theme = PILLAR_THEME[color];

    const isExplodingNow =
      lastExplosion !== null &&
      activeExplosionId === lastExplosion.id &&
      lastExplosion.carrierColor === color;

    const displayedStones = isExplodingNow
      ? lastExplosion.explodedStones
      : pillar.stones;
    const displayedSum = isExplodingNow ? lastExplosion.finalSum : pillar.sum;
    const stoneRows = chunkStonesIntoRows(displayedStones);

    const isDanger = displayedSum >= 10;
    const isWarning = displayedSum >= 7 && displayedSum < 10;

    return (
      <div
        key={color}
        className={`w-full flex flex-col items-center justify-end select-none transition-transform min-w-0 ${
          isExplodingNow ? 'animate-carrier-explode' : ''
        }`}
      >
        {/* 받침대 바로 위: 2열(grid-cols-2 gap-0.5 sm:gap-1.5) 돌 적층(Stacking) 영역 */}
        <div className="w-full max-w-[94px] sm:max-w-[120px] flex flex-col-reverse justify-start gap-0.5 sm:gap-1.5 pb-1 sm:pb-1.5">
          {stoneRows.map((row, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="grid grid-cols-2 gap-0.5 sm:gap-1.5 place-items-center w-full"
            >
              {renderStoneCell(row[0], isExplodingNow, color)}
              {renderStoneCell(row[1], isExplodingNow, color)}
            </div>
          ))}
        </div>

        {/* 하단 짐꾼 받침대(Base Pillar) 블록 */}
        <div
          className={`w-full max-w-[104px] sm:max-w-[136px] md:max-w-[148px] h-20 sm:h-28 md:h-32 shrink-0 rounded-xl border-2 ${theme.baseBg} ${
            isExplodingNow
              ? 'border-white ring-4 ring-red-500 brightness-125'
              : theme.baseBorder
          } shadow-2xl ${theme.shadowColor} relative overflow-hidden flex flex-col justify-between p-1.5 sm:p-2.5`}
        >
          <div
            className={`absolute top-0 inset-x-0 h-1.5 sm:h-2 ${theme.topLedgeBg} border-b border-black/30`}
          />

          <AtlasCarrierSilhouette
            className={`absolute inset-0 w-full h-full object-contain pointer-events-none ${theme.figureFill}`}
          />

          <div className="relative z-10 flex items-center justify-between gap-1 pt-0.5 leading-tight">
            <span className="text-xs sm:text-sm font-black tracking-wide text-white drop-shadow truncate">
              {tColor(color)}
            </span>
            <span className="text-[10px] sm:text-xs font-bold px-1 sm:px-1.5 py-0.5 rounded bg-black/50 text-white/95 backdrop-blur-[2px] truncate">
              {pillar.lastChipColor
                ? tColor(pillar.lastChipColor)
                : t('pillarIdleBadge')}
            </span>
          </div>

          <div className="relative z-10 mt-auto rounded-lg bg-black/60 backdrop-blur-[2px] border border-white/20 px-1.5 sm:px-2 py-1 text-center leading-tight">
            <div className="text-[10px] sm:text-xs text-zinc-100 font-bold truncate">
              {isExplodingNow
                ? t('pillarExplodingStatus')
                : isDanger
                  ? t('pillarDangerStatus')
                  : isWarning
                    ? t('pillarWarningStatus')
                    : t('pillarStonesCountStatus', {
                        count: displayedStones.length,
                      })}
            </div>
            <div className="flex items-baseline justify-center gap-0.5 sm:gap-1 mt-0.5">
              <span
                className={`text-lg sm:text-2xl font-black font-mono leading-none ${
                  isExplodingNow || isDanger ? 'text-amber-300' : 'text-white'
                }`}
              >
                {displayedSum}
              </span>
              <span className="text-[11px] sm:text-sm font-bold text-white/80 font-mono whitespace-nowrap">
                /{EXPLOSION_THRESHOLD}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="flex-1 min-h-0 w-full max-w-full sm:max-w-7xl mx-auto px-2 sm:px-5 pt-1.5 pb-1 flex flex-col justify-between gap-1.5 overflow-hidden">
      {/* 1. 상단 고정 영역 (shrink-0): 슬림 유틸리티 바 + 7인 2줄 미니 배지 그리드 */}
      <div className="shrink-0 space-y-1 w-full max-w-full overflow-x-hidden">
        {/* 상단 유틸리티 바: flex items-center justify-between gap-1 한 줄 고정 */}
        <header className="w-full max-w-full rounded-xl sm:rounded-2xl border border-zinc-800 bg-zinc-900/90 backdrop-blur-md px-2 sm:px-4 py-1.5 flex items-center justify-between gap-1 overflow-x-hidden">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <div className="px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-extrabold text-xs sm:text-sm whitespace-nowrap shrink-0">
              <span className="sm:hidden">
                R{round}/{MAX_ROUNDS}
              </span>
              <span className="hidden sm:inline">
                {t('roundBadge', { round, maxRounds: MAX_ROUNDS })}
              </span>
            </div>

            <div className="hidden md:block text-xs sm:text-sm font-bold text-zinc-200 whitespace-nowrap shrink-0">
              {half === 1 ? t('firstHalfLabel') : t('secondHalfLabel')}
            </div>

            {startPlayer && (
              <div className="text-xs sm:text-sm px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-center gap-1 min-w-0">
                <span className="text-xs leading-none shrink-0">👑</span>
                <span className="hidden md:inline shrink-0">
                  {t('firstPlayerLabel')}
                </span>
                <strong className="text-amber-300 truncate max-w-[4.5rem] sm:max-w-[8rem]">
                  {tPlayerName(startPlayer)}
                </strong>
              </div>
            )}

            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-300 text-xs sm:text-sm font-extrabold items-center gap-1.5 whitespace-nowrap shrink-0">
              <Eye className="w-3.5 h-3.5 shrink-0" />
              {tPhaseTitle(roundPhase, isPassedTurnOrder)}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {currentTurnPlayer &&
              phase === 'PLAYING' &&
              roundPhase === 'PLACEMENT' && (
                <div className="hidden xl:flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-200 font-semibold whitespace-nowrap">
                  <span>{t('currentTurnLabel')}</span>
                  <span className="font-extrabold text-amber-400">
                    {tPlayerName(currentTurnPlayer)}
                  </span>
                </div>
              )}

            <button
              type="button"
              onClick={() => {
                playChipSelect();
                setIsLogModalOpen(true);
              }}
              className="rounded-lg sm:rounded-xl border border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 px-2 sm:px-2.5 py-1.5 text-xs font-bold text-zinc-200 flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
              title={t('liveLogTitle')}
            >
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" />
              <span className="hidden md:inline">{t('liveLogTitle')}</span>
            </button>

            <RuleButton onClick={() => setIsRuleModalOpen(true)} />

            <LanguageSwitcher />

            <button
              type="button"
              onClick={onLeaveRoom}
              className="rounded-lg sm:rounded-xl border border-zinc-700 hover:bg-zinc-800 px-2 sm:px-2.5 py-1.5 text-xs font-bold text-zinc-300 flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
              title={t('leaveBtnShort')}
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">{t('leaveBtnShort')}</span>
            </button>
          </div>
        </header>

        {/* 7인 플레이어 및 배치 순서 큐: 모바일 2줄 그리드(grid-cols-4 sm:grid-cols-7 gap-1) */}
        <section className="w-full max-w-full rounded-xl sm:rounded-2xl border border-zinc-800 bg-zinc-900/80 px-2 py-1.5 overflow-x-hidden">
          <div className="flex items-center justify-between gap-2 mb-1 px-0.5 text-xs">
            <div className="flex items-center gap-1 font-extrabold text-amber-300 truncate min-w-0">
              <ListOrdered className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {placementQueue.length > 0
                  ? t('placementQueueTitle')
                  : getPhaseDescription()}
              </span>
            </div>

            {latestLog && (
              <button
                type="button"
                onClick={() => setIsLogModalOpen(true)}
                className="flex items-center gap-1 text-[11px] sm:text-xs text-zinc-300 hover:text-white truncate max-w-[45%] sm:max-w-md cursor-pointer"
              >
                <span className="font-mono text-amber-400 font-bold shrink-0">
                  [{latestLog.round}R]
                </span>
                <span className="truncate">{tLog(latestLog)}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 sm:gap-1.5 w-full max-w-full">
            {placementQueue.length > 0
              ? placementQueue.map((item) => {
                  const playerObj =
                    players.find((p) => p.id === item.playerId) ?? players[0];
                  return renderCompactPlayerSlot(playerObj, item);
                })
              : players.map((p) => renderCompactPlayerSlot(p))}
          </div>
        </section>
      </div>

      {/* 2. 중앙 가변 영역 (flex-1 min-h-0): 3색 짐꾼 받침대(RED / GREEN / BLUE) 및 돌 적층 스테이지 */}
      <section className="flex-1 min-h-0 w-full max-w-full rounded-xl sm:rounded-2xl border border-zinc-800 bg-zinc-950/95 px-2 sm:px-6 py-1.5 sm:py-2.5 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* 스테이지 상단 정보 바 */}
        <div className="shrink-0 flex items-center justify-between gap-1.5 border-b border-zinc-800/80 pb-1.5 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-xs sm:text-base font-extrabold text-white whitespace-nowrap shrink-0">
              {t('carrierSectionTitle')}
            </h2>
            <span className="hidden md:inline text-xs sm:text-sm text-zinc-400 truncate">
              {getPhaseDescription()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            {lastExplosion && (
              <div className="rounded-lg border border-red-500/45 bg-red-950/50 px-2 py-0.5 flex items-center gap-1 text-[11px] sm:text-xs text-red-200 truncate">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="truncate">
                  {t('lastExplosionBanner', {
                    round: lastExplosion.round,
                    carrier: tColor(lastExplosion.carrierColor),
                    playerName: tPlayerName({
                      id: lastExplosion.playerId,
                      name: lastExplosion.playerName,
                    }),
                    finalSum: lastExplosion.finalSum,
                    collectedCount: lastExplosion.collectedCount,
                    penalty: lastExplosion.penaltyAdded,
                    newBaseSum: lastExplosion.newBaseSum,
                  })}
                </span>
              </div>
            )}

            {!lastExplosion && lastSubmitted && (
              <div className="rounded-lg bg-zinc-900 border border-zinc-700/80 px-2 py-0.5 text-[11px] sm:text-xs text-zinc-200 truncate">
                <span className="hidden sm:inline">
                  {t('lastSubmittedLabel')}{' '}
                </span>
                <strong className="text-amber-300">
                  {t('lastSubmittedFormat', {
                    playerName: tPlayerName({
                      id: lastSubmitted.playerId,
                      name: lastSubmitted.playerName,
                    }),
                    carrier: tColor(lastSubmitted.targetCarrier),
                    card: lastSubmitted.card,
                    chip: tChipBadge(lastSubmitted.chip),
                  })}
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* 3개 받침대 가로 3열 배치 (grid grid-cols-3 gap-1.5 sm:gap-4 px-1: 360px 화면에서도 찌그러지지 않음) */}
        <div className="flex-1 min-h-0 w-full max-w-full overflow-y-auto overflow-x-hidden flex items-end justify-center py-1">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-4 px-1 w-full max-w-xl mx-auto items-end">
            {CARRIER_COLORS.map(renderCarrierPillar)}
          </div>
        </div>
      </section>

      {/* 실시간 진행 로그 모달 (언제든 열람 가능) */}
      {isLogModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsLogModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[85dvh] rounded-t-3xl sm:rounded-3xl border border-zinc-700 bg-zinc-900 p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl space-y-4 flex flex-col"
          >
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-base font-extrabold text-white">
                <History className="w-5 h-5 text-sky-400" />
                <span>{t('liveLogTitle')}</span>
                <span className="text-xs text-zinc-400 font-semibold">
                  ({t('liveLogRecentCount')})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 p-2 text-zinc-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto space-y-2 pr-1 text-sm flex-1">
              {[...logs].reverse().map((log) => (
                <div
                  key={log.id}
                  className={`rounded-xl px-3 py-2 leading-relaxed ${
                    log.type === 'EXPLOSION'
                      ? 'bg-red-950/60 text-red-200 border border-red-500/30 font-semibold'
                      : log.type === 'HALF_TIME' || log.type === 'GAME_OVER'
                        ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30 font-semibold'
                        : log.type === 'BOT_TAKEOVER'
                          ? 'bg-purple-950/50 text-purple-200 border border-purple-500/30'
                          : 'bg-zinc-950/60 text-zinc-200'
                  }`}
                >
                  <span className="text-xs font-mono text-zinc-400 mr-2">
                    [{log.round}R]
                  </span>
                  {tLog(log)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7라운드 종료 직후 중간 정산(HALF_TIME) 오버레이 모달 */}
      {phase === 'HALF_TIME' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-amber-500/50 bg-zinc-900 p-5 sm:p-8 shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                {t('halfTimeTitle')}
              </h3>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                {t('halfTimeDesc')}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 space-y-2 text-left max-h-56 overflow-y-auto">
              <div className="text-xs sm:text-sm font-bold text-zinc-400">
                {t('halfTimeScoreHeader')}
              </div>
              {[...players]
                .sort((a, b) => a.penaltyPoints - b.penaltyPoints)
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-sm py-1.5 border-b border-zinc-800/60 last:border-none"
                  >
                    <span className="font-semibold text-zinc-200">
                      {tPlayerName(p)}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        p.penaltyPoints > 0
                          ? 'text-red-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {t('penaltyPointsValue', { points: p.penaltyPoints })}
                    </span>
                  </div>
                ))}
            </div>

            {role === 'HOST' ? (
              <button
                type="button"
                onClick={proceedFromHalfTime}
                className="w-full min-h-[46px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold py-3 px-6 text-sm sm:text-base transition cursor-pointer"
              >
                {t('startSecondHalfBtn')}
              </button>
            ) : (
              <div className="text-sm text-amber-300 font-medium">
                {t('waitingForHostSecondHalf')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 14라운드 종료 후 최종 결과 및 최하위 2명 탈락(GAME_OVER) 모달 */}
      {phase === 'GAME_OVER' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-700 bg-zinc-900 p-5 sm:p-8 shadow-2xl space-y-5">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs sm:text-sm font-bold">
                <Skull className="w-4 h-4" />
                {t('gameOverBadge')}
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                {t('gameOverTitle')}
              </h3>
              <p className="text-sm text-zinc-400">{t('gameOverDesc')}</p>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {[...players]
                .sort((a, b) => a.penaltyPoints - b.penaltyPoints)
                .map((p, idx) => {
                  const isEliminated = eliminatedPlayerIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`rounded-xl border px-3.5 py-2.5 flex items-center justify-between text-sm sm:text-base ${
                        isEliminated
                          ? 'border-red-500/50 bg-red-950/40 text-red-200'
                          : 'border-zinc-800 bg-zinc-950/70 text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-zinc-400 w-6 shrink-0">
                          #{idx + 1}
                        </span>
                        {isEliminated ? (
                          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                        ) : (
                          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span className="font-bold truncate">
                          {tPlayerName(p)}
                        </span>
                        {isEliminated && (
                          <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-red-500 text-white whitespace-nowrap shrink-0">
                            {t('eliminatedBadge')}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold whitespace-nowrap shrink-0">
                        {t('penaltyPointsValue', { points: p.penaltyPoints })}
                      </span>
                    </div>
                  );
                })}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onLeaveRoom}
                className="flex-1 min-h-[46px] rounded-xl border border-zinc-700 hover:bg-zinc-800 py-3 text-sm sm:text-base font-semibold text-zinc-300 transition cursor-pointer"
              >
                {t('leaveRoomBtn')}
              </button>
              {role === 'HOST' && (
                <button
                  type="button"
                  onClick={resetToLobby}
                  className="flex-1 min-h-[46px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold py-3 text-sm sm:text-base flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('backToLobbyBtn')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 언제든 열람 가능한 반응형 게임 규칙 모달 */}
      <RuleModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
      />
    </main>
  );
}
