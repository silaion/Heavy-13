// src/components/GameOptionsModal.tsx
import { useEffect } from 'react';
import {
  CheckCircle2,
  Crown,
  Dices,
  Lock,
  Settings,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type { StartPlayerMode } from '../types/game';
import { useTranslation } from '../i18n/useTranslation';
import { useGameStore } from '../store/useGameStore';
import { playChipSelect } from '../utils/soundEffects';

export interface SettingsButtonProps {
  onClick: () => void;
}

export interface GameOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 로비(Lobby.tsx) 및 게임 보드(GameBoard.tsx) 우측 상단 헤더에 배치되는 '게임 설정(톱니바퀴)' 버튼
 */
export function SettingsButton({ onClick }: SettingsButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => {
        playChipSelect();
        onClick();
      }}
      title={t('optionsBtnTooltip')}
      aria-label={t('optionsBtnTooltip')}
      className="p-1.5 sm:p-2 lg:px-2.5 rounded-xl border border-stone-700 bg-stone-900/90 hover:bg-stone-800 hover:border-amber-500/50 text-xs sm:text-sm font-semibold text-stone-200 hover:text-amber-300 transition cursor-pointer select-none inline-flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
    >
      <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300 shrink-0" />
      <span className="hidden lg:inline">{t('optionsBtnLabel')}</span>
    </button>
  );
}

export function GameOptionsModal({ isOpen, onClose }: GameOptionsModalProps) {
  const { t } = useTranslation();

  const role = useGameStore((s) => s.role);
  const viewState = useGameStore((s) => s.viewState);
  const preferredOptions = useGameStore((s) => s.preferredOptions);
  const updateGameOptions = useGameStore((s) => s.updateGameOptions);

  // ESC 키 입력 시 모달 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        playChipSelect();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentMode: StartPlayerMode =
    viewState?.options?.startPlayerMode ?? preferredOptions.startPlayerMode;

  const isInLobbyRoom = Boolean(viewState && viewState.phase === 'LOBBY');
  const isPlayingOrAfter = Boolean(viewState && viewState.phase !== 'LOBBY');

  // 방 생성 전(role === 'NONE')이거나 방장이 로비 대기 중일 때만 수정 가능
  const canEdit =
    role === 'NONE' || (role === 'HOST' && isInLobbyRoom);

  const handleClose = () => {
    playChipSelect();
    onClose();
  };

  const handleSelectMode = (mode: StartPlayerMode) => {
    if (!canEdit || mode === currentMode) return;
    playChipSelect();
    updateGameOptions({ startPlayerMode: mode });
  };

  const getNoticeText = (): string => {
    if (role === 'NONE') return t('optionsLocalPrefNotice');
    if (isPlayingOrAfter) return t('optionsReadOnlyPlayingNotice');
    if (role === 'HOST') return t('optionsHostEditableNotice');
    return t('optionsReadOnlyGuestNotice');
  };

  const optionCards: readonly {
    mode: StartPlayerMode;
    label: string;
    desc: string;
    icon: typeof Crown;
  }[] = [
    {
      mode: 'HOST',
      label: t('optionsModeHost'),
      desc: t('optionsModeHostDesc'),
      icon: Crown,
    },
    {
      mode: 'RANDOM',
      label: t('optionsModeRandom'),
      desc: t('optionsModeRandomDesc'),
      icon: Dices,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-options-modal-title"
      onClick={handleClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5 overflow-hidden"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[90dvh] rounded-t-3xl sm:rounded-3xl border-t sm:border border-stone-700 bg-stone-900 text-stone-100 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* 상단 모달 헤더 */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3.5 border-b border-stone-800 bg-stone-950/70 flex items-start justify-between gap-2 shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-extrabold tracking-wider uppercase">
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              {t('optionsModalBadge')}
            </div>
            <h2
              id="game-options-modal-title"
              className="text-xl sm:text-2xl font-extrabold text-white tracking-tight"
            >
              {t('optionsModalTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-snug">
              {t('optionsModalSubtitle')}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label={t('optionsModalCloseBtn')}
            className="rounded-xl border border-stone-700 bg-stone-800/80 hover:bg-stone-700 p-2 text-stone-300 hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 스크롤 본문 영역 */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 flex-1">
          {/* 권한 / 읽기 전용 안내 배너 */}
          <div
            className={`rounded-xl border px-3.5 py-2.5 flex items-center gap-2 text-xs sm:text-sm font-semibold leading-snug ${
              canEdit
                ? 'border-emerald-500/35 bg-emerald-950/30 text-emerald-200'
                : 'border-amber-500/35 bg-amber-950/25 text-amber-200'
            }`}
          >
            {canEdit ? (
              <SlidersHorizontal className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{getNoticeText()}</span>
          </div>

          {/* 옵션 1: 첫 라운드 선 플레이어 결정 방식 */}
          <section className="rounded-2xl border border-stone-700/80 bg-stone-950/60 p-4 space-y-3.5">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>{t('optionsStartPlayerTitle')}</span>
                </h3>
                {!canEdit && (
                  <span className="px-2 py-0.5 rounded-full bg-stone-800 border border-stone-700 text-stone-300 text-xs font-bold whitespace-nowrap shrink-0">
                    {currentMode === 'HOST'
                      ? t('optionsModeHost')
                      : t('optionsModeRandom')}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                {t('optionsStartPlayerDesc')}
              </p>
            </div>

            {/* 세그먼트 토글 / 카드형 선택 버튼 */}
            <div className="grid grid-cols-2 gap-2.5">
              {optionCards.map((opt) => {
                const isSelected = currentMode === opt.mode;
                const Icon = opt.icon;

                return (
                  <button
                    key={opt.mode}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => handleSelectMode(opt.mode)}
                    aria-pressed={isSelected}
                    className={`rounded-2xl border-2 p-3 sm:p-3.5 text-left flex flex-col justify-between gap-2 transition select-none ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/10'
                        : 'border-stone-800 bg-stone-900/90 text-stone-300'
                    } ${
                      canEdit
                        ? isSelected
                          ? 'cursor-pointer'
                          : 'cursor-pointer hover:border-stone-600 hover:bg-stone-800/70'
                        : 'cursor-not-allowed opacity-85'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
                            isSelected ? 'text-amber-400' : 'text-stone-400'
                          }`}
                        />
                        <span
                          className={`text-sm sm:text-base font-extrabold truncate ${
                            isSelected ? 'text-amber-200' : 'text-white'
                          }`}
                        >
                          {opt.label}
                        </span>
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-stone-300 leading-relaxed">
                      {opt.desc}
                    </p>

                    {isSelected && (
                      <div className="pt-0.5">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-amber-400 text-stone-950 text-xs font-extrabold">
                          {t('optionsCurrentBadge')}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-stone-800 text-xs sm:text-sm text-amber-300 font-semibold leading-relaxed">
              {t('optionsSubsequentRoundsTip')}
            </div>
          </section>
        </div>

        {/* 하단 닫기 푸터 */}
        <div className="px-4 sm:px-6 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] border-t border-stone-800 bg-stone-950/80 flex justify-end shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold py-2.5 px-6 text-sm sm:text-base transition cursor-pointer"
          >
            {t('optionsModalCloseBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
