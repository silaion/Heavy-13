// src/components/GameBoard.tsx
import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Crown,
  Eye,
  ListOrdered,
  LogOut,
  RefreshCw,
  ShieldAlert,
  SkipForward,
  Skull,
  Sparkles,
  Trophy,
  User,
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
    shadowColor: 'shadow-green-950/80',
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
    } else if (
      latestLog &&
      latestLogId !== prevLatestLogIdRef.current
    ) {
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

  const renderPlacementQueueItem = (item: PlacementQueueItem) => {
    const isCurrentTurn =
      phase === 'PLAYING' &&
      roundPhase === 'PLACEMENT' &&
      item.playerId === currentTurnPlayerId;
    const isMe = item.playerId === myPlayerId;
    const isStarter = item.playerId === startPlayerId;
    const displayName = tPlayerName({
      id: item.playerId,
      name: item.playerName,
    });

    return (
      <div
        key={item.playerId}
        className={`rounded-xl border px-2.5 py-2 flex flex-col justify-between gap-1.5 transition-all ${
          isCurrentTurn
            ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/50 shadow-md shadow-amber-500/15'
            : item.status === 'PLACED'
              ? 'border-emerald-500/35 bg-emerald-950/25 opacity-75'
              : item.status === 'PASSED'
                ? 'border-purple-500/45 bg-purple-950/30'
                : 'border-zinc-800 bg-zinc-900/80'
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-[10px] font-black font-mono px-1.5 py-0.5 rounded ${
              isCurrentTurn
                ? 'bg-amber-400 text-zinc-950'
                : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            #{item.priorityOrder}
          </span>
          <div className="flex items-center gap-1">
            {isStarter && (
              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-500/25 text-amber-300">
                {t('starterBadge')}
              </span>
            )}
            {isMe && (
              <span className="text-[9px] font-extrabold px-1 py-0.5 rounded bg-sky-400 text-zinc-950">
                {t('meBadge')}
              </span>
            )}
          </div>
        </div>

        <div className="font-bold text-xs text-white truncate">
          {displayName}
        </div>

        <div className="flex items-center justify-between gap-1 pt-0.5">
          <span
            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border truncate ${CHIP_PILL_STYLE[item.chip]}`}
          >
            {tColor(item.chip)}
          </span>
          <span className="w-6 h-6 rounded-md bg-stone-200 text-stone-900 border border-stone-400 font-serif font-extrabold text-sm flex items-center justify-center shrink-0">
            {item.card}
          </span>
        </div>

        <div className="text-[10px] font-bold pt-0.5 flex items-center justify-between">
          {isCurrentTurn ? (
            <span className="text-amber-300 animate-pulse">
              {t('queueStatusActive')}
            </span>
          ) : item.status === 'PLACED' ? (
            <span className="text-emerald-300">
              {t('queueStatusPlaced')}
              {item.placedCarrier ? ` (${tColor(item.placedCarrier)})` : ''}
            </span>
          ) : item.status === 'PASSED' ? (
            <span className="text-purple-300">{t('queueStatusPassed')}</span>
          ) : (
            <span className="text-zinc-400">{t('queueStatusPending')}</span>
          )}
        </div>
      </div>
    );
  };

  const renderPlayerCard = (p: SanitizedOpponent) => {
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
        key={p.slotIndex}
        className={`relative rounded-2xl border p-2.5 sm:p-3 transition-all ${
          isEliminated
            ? 'border-red-500/60 bg-red-950/30 opacity-80'
            : isCurrentTurn
              ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/15 ring-2 ring-amber-400/50'
              : isMe
                ? 'border-sky-500/50 bg-zinc-900/90'
                : 'border-zinc-800 bg-zinc-900/60'
        }`}
      >
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                p.isHost
                  ? 'bg-amber-500 text-zinc-950'
                  : p.isBot
                    ? 'bg-zinc-800 text-zinc-300'
                    : 'bg-sky-500 text-zinc-950'
              }`}
            >
              {p.isHost ? (
                <Crown className="w-3.5 h-3.5" />
              ) : p.isBot ? (
                <Bot className="w-3.5 h-3.5" />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
            </span>
            <span className="font-bold text-xs sm:text-sm text-white truncate">
              {displayName}
            </span>
            {isMe && (
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-sky-400 text-zinc-950 shrink-0">
                {t('meBadge')}
              </span>
            )}
          </div>

          <div
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
              p.penaltyPoints > 0
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {t('penaltyBadge', { points: p.penaltyPoints })}
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
          <div className="rounded-lg bg-zinc-950/70 border border-zinc-800/80 px-2 py-1 flex items-center justify-between">
            <span className="text-zinc-400">{t('remainingCardsLabel')}</span>
            <span className="font-mono font-bold text-zinc-200">
              {t('remainingCardsUnit', { count: p.remainingCards })}
            </span>
          </div>
          <div className="rounded-lg bg-zinc-950/70 border border-zinc-800/80 px-2 py-1 flex items-center justify-between">
            <span className="text-zinc-400">{t('remainingChipsLabel')}</span>
            <span className="font-mono font-bold text-zinc-200">
              {t('remainingChipsUnit', { count: p.remainingChips })}
            </span>
          </div>
        </div>

        {/* 이번 라운드 제출 칩/카드 공개 상태 */}
        {submission && submission.hasSubmitted && (
          <div className="mt-2 rounded-lg bg-zinc-950/80 border border-zinc-800 px-2 py-1 flex items-center justify-between gap-1.5 text-[11px]">
            {submission.chip ? (
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${CHIP_PILL_STYLE[submission.chip]}`}
              >
                {tChipBadge(submission.chip)}
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {t('selectionDoneBadge')}
              </span>
            )}

            <span
              className={`px-2 py-0.5 rounded font-mono font-extrabold text-xs ${
                submission.card !== null
                  ? 'bg-stone-200 text-stone-900'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {submission.card !== null
                ? submission.card
                : t('hiddenCardLabel')}
            </span>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between text-[10px]">
          <div className="flex flex-wrap items-center gap-1">
            {isStarter && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                {t('starterBadge')}
              </span>
            )}
            {roundPhase === 'SELECTION' && !p.hasSubmittedThisRound && (
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-semibold flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {t('selectionSelectingBadge')}
              </span>
            )}
            {p.hasPassedThisRound && !p.hasActedThisRound && (
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold flex items-center gap-0.5">
                <SkipForward className="w-2.5 h-2.5" />
                {t('passWaitingBadge')}
              </span>
            )}
            {p.hasActedThisRound && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                {t('actedDoneBadge')}
              </span>
            )}
          </div>

          {isCurrentTurn && (
            <span className="font-extrabold text-amber-400 animate-pulse">
              {p.isBot ? t('botThinkingStatus') : t('turnActiveStatus')}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderStoneCell = (
    stone: CarrierStone | undefined,
    isExplodingNow: boolean
  ) => {
    if (!stone) {
      return <div className="aspect-square" />;
    }
    const ownerName = tPlayerName({
      id: stone.playerId,
      name: stone.playerName,
    });
    const chipLabel = tChipBadge(stone.chipColor);

    return (
      <div
        key={stone.id}
        title={t('stoneTileTooltip', { playerName: ownerName, chip: chipLabel })}
        className={`aspect-square rounded-md border-2 flex flex-col items-center justify-center relative animate-stone-drop ${
          isExplodingNow
            ? 'bg-red-500 text-white border-red-200 ring-2 ring-red-400 animate-pulse'
            : 'bg-stone-200 text-stone-900 border-stone-400 shadow-inner'
        }`}
      >
        <span className="text-2xl sm:text-3xl font-serif font-extrabold leading-none tracking-tight">
          {stone.value}
        </span>
        <span
          className={`text-[9px] sm:text-[10px] font-semibold truncate max-w-[90%] mt-0.5 ${
            isExplodingNow ? 'text-red-100' : 'text-stone-600'
          }`}
        >
          {ownerName}
        </span>
        {stone.chipColor === 'RAINBOW' && (
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-blue-500 ring-1 ring-stone-700"
            title={t('rainbowStoneTooltip')}
          />
        )}
      </div>
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
        className={`flex flex-col items-center justify-end select-none transition-transform ${
          isExplodingNow ? 'animate-carrier-explode' : ''
        }`}
      >
        {/* 받침대 바로 위: 2열(grid-cols-2) 돌 적층(Stacking) 영역 */}
        <div className="w-28 sm:w-36 md:w-40 min-h-[168px] sm:min-h-[210px] flex flex-col-reverse justify-start gap-1 sm:gap-1.5 px-1 pb-1">
          {stoneRows.map((row, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="grid grid-cols-2 gap-1 sm:gap-1.5 w-full"
            >
              {renderStoneCell(row[0], isExplodingNow)}
              {renderStoneCell(row[1], isExplodingNow)}
            </div>
          ))}
        </div>

        {/* 하단 짐꾼 받침대(Base Pillar) 블록 */}
        <div
          className={`w-28 sm:w-36 md:w-40 aspect-square rounded-lg border-2 ${theme.baseBg} ${
            isExplodingNow
              ? 'border-white ring-4 ring-red-500 brightness-125'
              : theme.baseBorder
          } shadow-2xl ${theme.shadowColor} relative overflow-hidden flex flex-col justify-between p-2 sm:p-2.5`}
        >
          <div
            className={`absolute top-0 inset-x-0 h-2.5 ${theme.topLedgeBg} border-b border-black/30`}
          />

          <AtlasCarrierSilhouette
            className={`absolute inset-0 w-full h-full object-contain pointer-events-none ${theme.figureFill}`}
          />

          <div className="relative z-10 flex items-center justify-between gap-1 pt-1">
            <span className="text-[10px] sm:text-xs font-black tracking-wider text-white drop-shadow">
              {tColor(color)}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/45 text-white/95 backdrop-blur-[2px] truncate">
              {pillar.lastChipColor
                ? tChipBadge(pillar.lastChipColor)
                : t('pillarIdleBadge')}
            </span>
          </div>

          <div className="relative z-10 mt-auto rounded-md bg-black/55 backdrop-blur-[2px] border border-white/20 px-2 py-1 text-center">
            <div className="text-[9px] sm:text-[10px] text-zinc-200 font-semibold leading-tight">
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
            <div className="flex items-baseline justify-center gap-1 mt-0.5">
              <span
                className={`text-lg sm:text-2xl font-black font-mono leading-none ${
                  isExplodingNow || isDanger ? 'text-amber-300' : 'text-white'
                }`}
              >
                {displayedSum}
              </span>
              <span className="text-xs sm:text-sm font-bold text-white/75 font-mono">
                / {EXPLOSION_THRESHOLD}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 pt-3 pb-4 space-y-4">
      {/* 상단 상태 헤더 바 (우측 상단에 LanguageSwitcher 배치) */}
      <header className="rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-md px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-extrabold text-xs sm:text-sm">
            {t('roundBadge', { round, maxRounds: MAX_ROUNDS })}
          </div>
          <div className="text-xs sm:text-sm font-semibold text-zinc-300">
            {half === 1 ? t('firstHalfLabel') : t('secondHalfLabel')}
          </div>
          {startPlayer && (
            <div className="text-xs px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('firstPlayerLabel')}</span>
              <strong className="text-amber-300">
                {tPlayerName(startPlayer)}
              </strong>
            </div>
          )}
          <div className="hidden md:inline-block text-xs text-zinc-500 font-mono">
            {t('roomCodeLabel')} {viewState.roomCode}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {currentTurnPlayer &&
            phase === 'PLAYING' &&
            roundPhase === 'PLACEMENT' && (
              <div className="text-xs sm:text-sm px-3 py-1 rounded-xl bg-zinc-800 text-zinc-200 font-medium">
                {t('currentTurnLabel')}{' '}
                <span className="font-bold text-amber-400">
                  {tPlayerName(currentTurnPlayer)}
                </span>
              </div>
            )}

          <RuleButton onClick={() => setIsRuleModalOpen(true)} />

          <LanguageSwitcher />

          <button
            type="button"
            onClick={onLeaveRoom}
            className="rounded-xl border border-zinc-700 hover:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t('leaveBtnShort')}
          </button>
        </div>
      </header>

      {/* 현재 라운드 페이즈 배너 및 배치 순서 큐(Placement Queue) */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-300 text-xs font-extrabold flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              {tPhaseTitle(roundPhase, isPassedTurnOrder)}
            </span>
            <p className="text-xs text-zinc-300">{getPhaseDescription()}</p>
          </div>
        </div>

        {/* REVEAL_CARDS / PLACEMENT 단계: 확정된 배치 순서 큐(Placement Queue) 표시 */}
        {placementQueue.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-zinc-800/80">
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
              <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                <ListOrdered className="w-4 h-4" />
                <span>{t('placementQueueTitle')}</span>
              </div>
              <span className="text-[11px] text-zinc-400">
                {t('placementQueueHint')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {placementQueue.map(renderPlacementQueueItem)}
            </div>
          </div>
        )}
      </section>

      {/* 중앙 3색 짐꾼 받침대(RED / GREEN / BLUE) 및 2열 돌 적층 스테이지 */}
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/95 p-4 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white">
              {t('carrierSectionTitle')}
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400">
              {t('carrierSectionDesc')}
            </p>
          </div>

          {lastSubmitted && (
            <div className="rounded-xl bg-zinc-900 border border-zinc-700/80 px-3 py-1.5 text-xs text-zinc-200">
              {t('lastSubmittedLabel')}{' '}
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

        {/* 3개 받침대 가로 나란히 배치 (RED - GREEN - BLUE) */}
        <div className="flex items-end justify-center gap-3 sm:gap-6 md:gap-10 pt-2 pb-1 overflow-x-auto">
          {CARRIER_COLORS.map(renderCarrierPillar)}
        </div>

        {/* 최근 폭발 배너 */}
        {lastExplosion && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
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
      </section>

      {/* 하단: 7인 플레이어 현황판 + 실시간 진행 로그 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 content-start">
          {players.map(renderPlayerCard)}
        </div>

        <div className="lg:col-span-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3.5 flex flex-col min-h-[150px] max-h-[220px]">
          <div className="text-xs font-bold text-zinc-400 mb-2 flex items-center justify-between">
            <span>{t('liveLogTitle')}</span>
            <span className="text-[10px] text-zinc-500">
              {t('liveLogRecentCount')}
            </span>
          </div>
          <div className="overflow-y-auto space-y-1.5 pr-1 text-xs flex-1">
            {[...logs].reverse().map((log) => (
              <div
                key={log.id}
                className={`rounded-lg px-2.5 py-1.5 leading-relaxed ${
                  log.type === 'EXPLOSION'
                    ? 'bg-red-950/60 text-red-200 border border-red-500/30 font-semibold'
                    : log.type === 'HALF_TIME' || log.type === 'GAME_OVER'
                      ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30 font-semibold'
                      : log.type === 'BOT_TAKEOVER'
                        ? 'bg-purple-950/50 text-purple-200 border border-purple-500/30'
                        : 'bg-zinc-950/50 text-zinc-300'
                }`}
              >
                <span className="text-[10px] font-mono text-zinc-500 mr-1.5">
                  [{log.round}R]
                </span>
                {tLog(log)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7라운드 종료 직후 중간 정산(HALF_TIME) 오버레이 모달 */}
      {phase === 'HALF_TIME' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-amber-500/50 bg-zinc-900 p-6 sm:p-8 shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-2xl font-extrabold text-white">
                {t('halfTimeTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {t('halfTimeDesc')}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3.5 space-y-2 text-left max-h-56 overflow-y-auto">
              <div className="text-xs font-bold text-zinc-400">
                {t('halfTimeScoreHeader')}
              </div>
              {[...players]
                .sort((a, b) => a.penaltyPoints - b.penaltyPoints)
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-xs py-1 border-b border-zinc-800/60 last:border-none"
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
                className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold py-3.5 px-6 text-sm transition cursor-pointer"
              >
                {t('startSecondHalfBtn')}
              </button>
            ) : (
              <div className="text-xs text-amber-300 font-medium">
                {t('waitingForHostSecondHalf')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 14라운드 종료 후 최종 결과 및 최하위 2명 탈락(GAME_OVER) 모달 */}
      {phase === 'GAME_OVER' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-700 bg-zinc-900 p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold">
                <Skull className="w-3.5 h-3.5" />
                {t('gameOverBadge')}
              </div>
              <h3 className="text-2xl font-extrabold text-white">
                {t('gameOverTitle')}
              </h3>
              <p className="text-xs text-zinc-400">{t('gameOverDesc')}</p>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {[...players]
                .sort((a, b) => a.penaltyPoints - b.penaltyPoints)
                .map((p, idx) => {
                  const isEliminated = eliminatedPlayerIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`rounded-xl border px-3.5 py-2.5 flex items-center justify-between text-xs sm:text-sm ${
                        isEliminated
                          ? 'border-red-500/50 bg-red-950/40 text-red-200'
                          : 'border-zinc-800 bg-zinc-950/70 text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-zinc-400 w-5">
                          #{idx + 1}
                        </span>
                        {isEliminated ? (
                          <ShieldAlert className="w-4 h-4 text-red-400" />
                        ) : (
                          <Trophy className="w-4 h-4 text-amber-400" />
                        )}
                        <span className="font-bold">{tPlayerName(p)}</span>
                        {isEliminated && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-500 text-white">
                            {t('eliminatedBadge')}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold">
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
                className="flex-1 rounded-xl border border-zinc-700 hover:bg-zinc-800 py-3 text-xs sm:text-sm font-semibold text-zinc-300 transition cursor-pointer"
              >
                {t('leaveRoomBtn')}
              </button>
              {role === 'HOST' && (
                <button
                  type="button"
                  onClick={resetToLobby}
                  className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold py-3 text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
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
    </div>
  );
}
