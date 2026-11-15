// src/components/GameBoard.tsx
import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Crown,
  Eye,
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
  const [tappedStoneId, setTappedStoneId] = useState<string | null>(null);

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

  const startPlayer = players.find((p) => p.id === startPlayerId);
  const submittedCount = players.filter((p) => p.hasSubmittedThisRound).length;
  const isPassedTurnOrder =
    roundPhase === 'PLACEMENT' &&
    turnQueue.length === 0 &&
    passedQueue.length > 0;

  const latestLog = logs[logs.length - 1] ?? null;

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

  // 배치 순서가 공개된 단계(REVEAL_CARDS / PLACEMENT)에는 우선순위 큐 순서대로,
  // 그 이전(SELECTION / REVEAL_CHIPS)에는 기본 슬롯 순서대로 7인 카드를 렌더링한다.
  const queueMap = new Map<string, PlacementQueueItem>();
  for (const item of placementQueue) {
    queueMap.set(item.playerId, item);
  }

  const orderedPlayers: SanitizedOpponent[] =
    placementQueue.length > 0
      ? placementQueue
          .map((q) => players.find((p) => p.id === q.playerId))
          .filter((p): p is SanitizedOpponent => p !== undefined)
      : players;

  /**
   * 2단 정보 구조의 7인 참가자 카드형 그리드 아이템
   * - 레이아웃: grid-cols-4 sm:grid-cols-7 gap-2 내부의 개별 카드
   * - 최소 높이: min-h-[68px] sm:min-h-[82px], 패딩 p-2 sm:p-2.5, rounded-2xl
   * - 1단(상단 행): 배치 우선순위(#1~#7) 또는 역할 아이콘 + 선 플레이어(👑) + 닉네임 + 나(ME) 배지 + 누적 벌점(-N)
   * - 2단(하단 행): 제출 완료 여부 / 공개된 색깔 칩 배지 + 바위 카드 숫자 타일 + 현재 배치 차례/패스/완료 상태
   */
  const renderPlayerStatusCard = (p: SanitizedOpponent) => {
    const queueItem = queueMap.get(p.id);
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
        className={`min-h-[68px] sm:min-h-[82px] rounded-2xl border p-2 sm:p-2.5 flex flex-col justify-between gap-1.5 transition-all min-w-0 ${
          isEliminated
            ? 'border-red-500/60 bg-red-950/35 opacity-80'
            : isCurrentTurn
              ? 'border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400'
              : isStarter
                ? 'border-amber-500/60 bg-amber-500/10'
                : isMe
                  ? 'border-sky-500/65 bg-zinc-900/95'
                  : 'border-zinc-800 bg-zinc-900/80'
        }`}
      >
        {/* 1단(상단 행): 순번/선(👑)/아이콘 + 닉네임 + 누적 벌점 */}
        <div className="flex items-center justify-between gap-1 leading-tight">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {queueItem ? (
              <span
                className={`px-1.5 py-0.5 rounded-md text-xs font-black font-mono leading-none shrink-0 ${
                  isCurrentTurn
                    ? 'bg-amber-400 text-zinc-950'
                    : 'bg-zinc-800 text-amber-300 border border-amber-500/30'
                }`}
              >
                #{queueItem.priorityOrder}
              </span>
            ) : (
              <span
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                  p.isHost
                    ? 'bg-amber-500 text-zinc-950'
                    : p.isBot
                      ? 'bg-zinc-800 text-zinc-300'
                      : 'bg-sky-500 text-zinc-950'
                }`}
              >
                {p.isHost ? (
                  <Crown className="w-3 h-3" />
                ) : p.isBot ? (
                  <Bot className="w-3 h-3" />
                ) : (
                  <User className="w-3 h-3" />
                )}
              </span>
            )}

            {isStarter && (
              <span
                className="text-xs sm:text-sm leading-none shrink-0"
                title={t('firstPlayerLabel')}
              >
                👑
              </span>
            )}

            <span
              className={`text-xs sm:text-sm truncate whitespace-nowrap leading-tight ${
                isCurrentTurn
                  ? 'font-extrabold text-amber-200'
                  : isMe
                    ? 'font-extrabold text-sky-300'
                    : isStarter
                      ? 'font-extrabold text-amber-100'
                      : 'font-bold text-white'
              }`}
            >
              {displayName}
            </span>

            {isMe && (
              <span className="hidden lg:inline-block px-1 py-0.5 rounded bg-sky-400 text-zinc-950 text-xs font-extrabold leading-none shrink-0">
                {t('meBadge')}
              </span>
            )}
          </div>

          {/* 우측 상단: 누적 벌점 배지 */}
          <span
            className={`px-1.5 py-0.5 rounded-md text-xs font-mono font-extrabold leading-none shrink-0 whitespace-nowrap ${
              p.penaltyPoints > 0
                ? 'bg-red-500/25 text-red-200 border border-red-500/45'
                : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            -{p.penaltyPoints}
          </span>
        </div>

        {/* 2단(하단 행): 제출 상태 / 공개된 칩·카드 배지 + 현재 턴/패스/완료 상태 */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-zinc-800/70 leading-tight">
          {/* 좌측 하단: 제출된 칩 + 바위 카드 또는 선택 상태 */}
          <div className="flex items-center gap-1 min-w-0">
            {submission && submission.hasSubmitted ? (
              <>
                {submission.chip ? (
                  <span
                    className={`px-1.5 py-0.5 rounded-md border text-xs font-extrabold leading-none truncate whitespace-nowrap ${CHIP_PILL_STYLE[submission.chip]}`}
                  >
                    {tColor(submission.chip)}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-0.5 whitespace-nowrap">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t('selectionDoneBadge')}</span>
                  </span>
                )}

                {submission.card !== null ? (
                  <span
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md font-serif font-extrabold text-xs sm:text-sm flex items-center justify-center leading-none shrink-0 ${
                      p.hasActedThisRound
                        ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/40'
                        : 'bg-stone-200 text-stone-900 border border-stone-400 shadow-inner'
                    }`}
                  >
                    {submission.card}
                  </span>
                ) : submission.chip ? (
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-zinc-800 text-zinc-400 font-mono font-bold text-xs flex items-center justify-center leading-none shrink-0">
                    {t('hiddenCardLabel')}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1 whitespace-nowrap truncate">
                <Clock className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                <span className="truncate">{t('selectionSelectingBadge')}</span>
              </span>
            )}
          </div>

          {/* 우측 하단: 배치 차례 / 패스 / 완료 / 선 표시 */}
          <div className="shrink-0 whitespace-nowrap">
            {isCurrentTurn ? (
              <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-zinc-950 text-xs font-extrabold leading-none animate-pulse inline-block">
                {t('turnActiveStatus')}
              </span>
            ) : p.hasPassedThisRound && !p.hasActedThisRound ? (
              <span
                className="px-1.5 py-0.5 rounded-md bg-purple-500/25 border border-purple-500/40 text-purple-200 text-xs font-bold leading-none inline-flex items-center gap-0.5"
                title={t('passWaitingBadge')}
              >
                <SkipForward className="w-3 h-3 shrink-0" />
                <span className="hidden sm:inline">{t('queueStatusPassed')}</span>
              </span>
            ) : p.hasActedThisRound ? (
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold leading-none inline-block">
                {t('actedDoneBadge')}
              </span>
            ) : isStarter ? (
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold leading-none inline-block">
                {t('starterBadge')}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  /**
   * 받침대 위 2열 돌 타일 렌더링
   * - 모바일: aspect-square w-full max-w-[44px] sm:max-w-[56px]
   * - 터치(Tap) 시 화면 좌우 끝에서 잘리지 않는 닉네임 툴팁 표시
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
    const chipLabel = tChipBadge(stone.chipColor);
    const isTooltipOpen = tappedStoneId === stone.id;

    // 화면 좌우 가장자리 잘림 방지를 위한 툴팁 수평 정렬 오프셋
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
        onClick={(e) => {
          e.stopPropagation();
          playChipSelect();
          setTappedStoneId((prev) => (prev === stone.id ? null : stone.id));
        }}
        title={t('stoneTileTooltip', { playerName: ownerName, chip: chipLabel })}
        className={`aspect-square w-full max-w-[44px] sm:max-w-[56px] rounded-lg border-2 flex flex-col items-center justify-center relative animate-stone-drop cursor-pointer select-none ${
          isExplodingNow
            ? 'bg-red-500 text-white border-red-200 ring-2 ring-red-400 animate-pulse'
            : isTooltipOpen
              ? 'bg-amber-200 text-stone-950 border-amber-400 ring-2 ring-amber-400'
              : 'bg-stone-200 text-stone-900 border-stone-400 shadow-inner'
        }`}
      >
        <span className="text-lg sm:text-2xl font-serif font-extrabold leading-none tracking-tight">
          {stone.value}
        </span>
        <span
          className={`text-xs font-semibold truncate max-w-[92%] leading-none mt-0.5 ${
            isExplodingNow ? 'text-red-100' : 'text-stone-700'
          }`}
        >
          {ownerName}
        </span>
        {stone.chipColor === 'RAINBOW' && (
          <span
            className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-blue-500 ring-1 ring-stone-700"
            title={t('rainbowStoneTooltip')}
          />
        )}

        {/* 모바일 터치(Tap) 시 잘리지 않는 제출자/칩 툴팁 팝오버 */}
        {isTooltipOpen && (
          <div
            className={`absolute -top-8 ${tooltipAlignClass} z-30 px-2.5 py-1 rounded-md bg-zinc-950/95 border border-amber-400/70 text-xs sm:text-sm font-bold text-amber-200 whitespace-nowrap shadow-lg pointer-events-none`}
          >
            {ownerName} · {tColor(stone.chipColor)}
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
        {/* 받침대 바로 위: 2열(grid-cols-2 gap-0.5) 돌 적층(Stacking) 영역 */}
        <div className="w-full max-w-[96px] sm:max-w-[124px] min-h-[76px] sm:min-h-[112px] max-h-[19vh] sm:max-h-[26vh] overflow-y-auto overflow-x-visible flex flex-col-reverse justify-start gap-0.5 sm:gap-1.5 px-0.5 pb-1">
          {stoneRows.map((row, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="grid grid-cols-2 gap-0.5 sm:gap-1.5 w-full justify-items-center"
            >
              {renderStoneCell(row[0], isExplodingNow, color)}
              {renderStoneCell(row[1], isExplodingNow, color)}
            </div>
          ))}
        </div>

        {/* 하단 짐꾼 받침대(Base Pillar) 블록 */}
        <div
          className={`w-full max-w-[104px] sm:max-w-[136px] h-20 sm:h-28 rounded-xl border-2 ${theme.baseBg} ${
            isExplodingNow
              ? 'border-white ring-4 ring-red-500 brightness-125'
              : theme.baseBorder
          } shadow-xl ${theme.shadowColor} relative overflow-hidden flex flex-col justify-between p-1.5 sm:p-2.5 shrink-0`}
        >
          <div
            className={`absolute top-0 inset-x-0 h-1.5 sm:h-2 ${theme.topLedgeBg} border-b border-black/30`}
          />

          <AtlasCarrierSilhouette
            className={`absolute inset-0 w-full h-full object-contain pointer-events-none ${theme.figureFill}`}
          />

          <div className="relative z-10 flex items-center justify-between gap-1 pt-0.5 leading-tight">
            <span className="text-xs sm:text-sm font-black tracking-wide text-white drop-shadow whitespace-nowrap truncate">
              {tColor(color)}
            </span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-black/50 text-white/95 backdrop-blur-[2px] truncate whitespace-nowrap">
              {pillar.lastChipColor
                ? tColor(pillar.lastChipColor)
                : t('pillarIdleBadge')}
            </span>
          </div>

          <div className="relative z-10 mt-auto rounded-lg bg-black/60 backdrop-blur-[2px] border border-white/20 px-1.5 py-0.5 sm:py-1 text-center">
            <div className="text-xs text-zinc-200 font-semibold leading-tight truncate whitespace-nowrap">
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
            <div className="flex items-baseline justify-center gap-0.5 sm:gap-1">
              <span
                className={`text-lg sm:text-2xl font-black font-mono leading-none ${
                  isExplodingNow || isDanger ? 'text-amber-300' : 'text-white'
                }`}
              >
                {displayedSum}
              </span>
              <span className="text-xs sm:text-sm font-bold text-white/80 font-mono">
                /{EXPLOSION_THRESHOLD}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={() => {
        if (tappedStoneId !== null) setTappedStoneId(null);
      }}
      className="w-full max-w-full lg:max-w-7xl mx-auto px-2 sm:px-5 pt-[max(0.375rem,env(safe-area-inset-top))] pb-1 flex-1 min-h-0 flex flex-col justify-between gap-1.5 sm:gap-2 overflow-hidden overflow-x-hidden"
    >
      {/* 1. 상단 영역 (shrink-0): 1줄 유틸리티 헤더 바 + 7인 2단 카드형 그리드 */}
      <div className="shrink-0 space-y-1.5">
        {/* 상단 유틸리티 바 (모바일 360px~430px에서도 왕관 배지와 유틸리티 버튼이 잘리거나 겹치지 않도록 최적화) */}
        <header className="rounded-xl sm:rounded-2xl border border-zinc-800 bg-zinc-900/90 backdrop-blur-md px-2 sm:px-4 py-1.5 flex items-center justify-between gap-1 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 shrink-0">
            {/* 라운드 표시 배지 */}
            <div className="inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold text-xs sm:text-sm whitespace-nowrap shrink-0">
              <span className="sm:hidden">
                R{round}/{MAX_ROUNDS}
              </span>
              <span className="hidden sm:inline">
                {t('roundBadge', { round, maxRounds: MAX_ROUNDS })} ·{' '}
                {half === 1 ? t('firstHalfLabel') : t('secondHalfLabel')}
              </span>
            </div>

            {/* 선 플레이어(👑 + 짧은 닉네임) 배지: shrink-0 및 rounded-full로 테두리 잘림 방지 */}
            {startPlayer && (
              <div
                className="inline-flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full bg-amber-500/10 border border-amber-500/35 text-amber-200 font-bold text-xs sm:text-sm whitespace-nowrap shrink-0"
                title={`${t('firstPlayerLabel')}: ${tPlayerName(startPlayer)}`}
              >
                <span
                  className="text-xs sm:text-sm leading-none shrink-0"
                  aria-hidden="true"
                >
                  👑
                </span>
                <strong className="text-amber-300 truncate max-w-[52px] sm:max-w-[100px]">
                  {tPlayerName(startPlayer)}
                </strong>
              </div>
            )}

            {/* 현재 페이즈 상태 텍스트 (데스크톱/태블릿 보조 표시; 모바일은 하단 독 및 카드 그리드에 표시) */}
            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 text-xs sm:text-sm font-bold whitespace-nowrap truncate min-w-0">
              <Eye className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {tPhaseTitle(roundPhase, isPassedTurnOrder)}
              </span>
            </div>
          </div>

          {/* 우측 유틸리티 버튼: 규칙(?), 음소거, 언어 전환(KO/EN/JA), 나가기 */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <RuleButton onClick={() => setIsRuleModalOpen(true)} />
            <LanguageSwitcher />
            <button
              type="button"
              onClick={onLeaveRoom}
              aria-label={t('leaveBtnShort')}
              title={t('leaveBtnShort')}
              className="p-1.5 sm:p-2 md:px-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs sm:text-sm font-semibold text-zinc-300 flex items-center justify-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="hidden md:inline">{t('leaveBtnShort')}</span>
            </button>
          </div>
        </header>

        {/* 7인 참가자 명단: 반응형 2줄 카드형 그리드 (grid-cols-4 sm:grid-cols-7 gap-2) */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {orderedPlayers.map(renderPlayerStatusCard)}
        </div>
      </div>

      {/* 2. 중앙 영역 (flex-1 min-h-0): 3색 짐꾼 받침대(grid-cols-3) 및 하단 1줄 상태 티커 */}
      <section className="flex-1 min-h-0 rounded-2xl border border-zinc-800 bg-zinc-950/95 px-1.5 sm:px-6 py-1.5 sm:py-2 shadow-xl flex flex-col justify-between overflow-hidden">
        {/* 3개 받침대 가로 3등분 균등 배치 (grid-cols-3 gap-1.5 sm:gap-4 px-1) */}
        <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-4 md:gap-8 px-1 w-full max-w-xl mx-auto items-end">
            {CARRIER_COLORS.map(renderCarrierPillar)}
          </div>
        </div>

        {/* 중앙 하단 컴팩트 1줄 정보 바: 직전 배치 / 최근 폭발 / 실시간 로그 티커 */}
        <div className="shrink-0 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-xs sm:text-sm font-medium leading-tight px-1">
          {lastExplosion ? (
            <div className="flex items-center gap-1.5 text-red-200 font-semibold truncate min-w-0 flex-1">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
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
          ) : latestLog ? (
            <div className="flex items-center gap-1.5 text-zinc-200 truncate min-w-0 flex-1">
              <span className="font-mono font-bold text-amber-400 shrink-0">
                [{latestLog.round}R]
              </span>
              <span className="truncate">{tLog(latestLog)}</span>
            </div>
          ) : (
            <div className="text-zinc-300 truncate flex-1">
              {getPhaseDescription()}
            </div>
          )}

          {lastSubmitted && (
            <div className="hidden sm:flex items-center gap-1 text-xs sm:text-sm text-zinc-300 shrink-0 whitespace-nowrap">
              <span>{t('lastSubmittedLabel')}</span>
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
      </section>

      {/* 7라운드 종료 직후 중간 정산(HALF_TIME) 오버레이 모달 */}
      {phase === 'HALF_TIME' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-amber-500/50 bg-zinc-900 p-6 sm:p-8 shadow-2xl space-y-5 text-center">
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

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3.5 space-y-2 text-left max-h-56 overflow-y-auto">
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
                className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold py-3 px-6 text-sm sm:text-base transition cursor-pointer"
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
          <div className="w-full max-w-lg rounded-3xl border border-zinc-700 bg-zinc-900 p-6 sm:p-8 shadow-2xl space-y-5">
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
                .sort((a, b) => {
                  const aElim = eliminatedPlayerIds.includes(a.id) ? 1 : 0;
                  const bElim = eliminatedPlayerIds.includes(b.id) ? 1 : 0;
                  if (aElim !== bElim) return aElim - bElim;
                  if (a.penaltyPoints !== b.penaltyPoints) {
                    return a.penaltyPoints - b.penaltyPoints;
                  }
                  return a.slotIndex - b.slotIndex;
                })
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
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-zinc-400 w-6">
                          #{idx + 1}
                        </span>
                        {isEliminated ? (
                          <ShieldAlert className="w-4 h-4 text-red-400" />
                        ) : (
                          <Trophy className="w-4 h-4 text-amber-400" />
                        )}
                        <span className="font-bold">{tPlayerName(p)}</span>
                        {isEliminated && (
                          <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-red-500 text-white">
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
                className="flex-1 min-h-[48px] rounded-xl border border-zinc-700 hover:bg-zinc-800 py-3 text-sm sm:text-base font-semibold text-zinc-300 transition cursor-pointer"
              >
                {t('leaveRoomBtn')}
              </button>
              {role === 'HOST' && (
                <button
                  type="button"
                  onClick={resetToLobby}
                  className="flex-1 min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold py-3 text-sm sm:text-base flex items-center justify-center gap-1.5 transition cursor-pointer"
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
