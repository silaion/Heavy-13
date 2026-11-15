// src/components/RuleModal.tsx
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Crown,
  Flame,
  HelpCircle,
  Layers,
  ListOrdered,
  RefreshCw,
  SkipForward,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { playChipSelect } from '../utils/soundEffects';
import { LanguageSwitcher } from './LanguageSwitcher';

export type RuleTab = 'ALL' | 'FLOW' | 'OVERLOAD';

export interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface RuleButtonProps {
  onClick: () => void;
}

/**
 * 로비(Lobby.tsx) 및 게임 보드(GameBoard.tsx) 우측 상단 헤더에 배치되는 '게임 규칙(?)' 아이콘 버튼
 */
export function RuleButton({ onClick }: RuleButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => {
        playChipSelect();
        onClick();
      }}
      title={t('ruleBtnTooltip')}
      aria-label={t('ruleBtnTooltip')}
      className="p-1.5 sm:p-2 md:px-2.5 rounded-xl border border-stone-700 bg-stone-900/90 hover:bg-stone-800 hover:border-amber-500/50 text-xs sm:text-sm font-semibold text-stone-200 hover:text-amber-300 transition cursor-pointer select-none inline-flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
    >
      <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
      <span className="hidden md:inline">{t('ruleBtnLabel')}</span>
    </button>
  );
}

export function RuleModal({ isOpen, onClose }: RuleModalProps) {
  const { t, tColor } = useTranslation();
  const [activeTab, setActiveTab] = useState<RuleTab>('ALL');

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

  const handleClose = () => {
    playChipSelect();
    onClose();
  };

  const handleTabChange = (tab: RuleTab) => {
    playChipSelect();
    setActiveTab(tab);
  };

  const showSection1 = activeTab === 'ALL';
  const showSection2 = activeTab === 'ALL' || activeTab === 'FLOW';
  const showSection3 =
    activeTab === 'ALL' || activeTab === 'FLOW' || activeTab === 'OVERLOAD';
  const showSection4 = activeTab === 'ALL' || activeTab === 'OVERLOAD';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rule-modal-title"
      onClick={handleClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5 overflow-hidden"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl h-[90dvh] sm:h-auto sm:max-h-[90dvh] rounded-t-3xl sm:rounded-3xl border-t sm:border border-stone-700 bg-stone-900 text-stone-100 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* 상단 모달 헤더 */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3.5 border-b border-stone-800 bg-stone-950/70 space-y-3 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-extrabold tracking-wider uppercase">
                <BookOpen className="w-3.5 h-3.5" />
                {t('ruleModalBadge')}
              </div>
              <h2
                id="rule-modal-title"
                className="text-xl sm:text-2xl font-extrabold text-white tracking-tight"
              >
                {t('ruleModalTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-stone-300">
                {t('ruleModalSubtitle')}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <LanguageSwitcher />
              <button
                type="button"
                onClick={handleClose}
                aria-label={t('ruleModalCloseBtn')}
                className="rounded-xl border border-stone-700 bg-stone-800/80 hover:bg-stone-700 p-2 text-stone-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 상단 필터 탭 (모바일 세로 화면 최적화) */}
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-stone-900/90 border border-stone-800 p-1">
            {(
              [
                { id: 'ALL', label: t('ruleTabAll') },
                { id: 'FLOW', label: t('ruleTabFlow') },
                { id: 'OVERLOAD', label: t('ruleTabOverload') },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`min-h-[44px] py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer select-none whitespace-nowrap truncate ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 shadow-md'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 스크롤 본문 영역 */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-5 flex-1">
          {/* 섹션 1: 게임 개요 및 승리 조건 */}
          {showSection1 && (
            <section className="rounded-2xl border border-stone-700/80 bg-stone-950/60 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-2 text-base sm:text-lg font-extrabold text-amber-300">
                <Users className="w-5 h-5 shrink-0" />
                <h3>{t('ruleSec1Title')}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm sm:text-base">
                <div className="rounded-xl border border-stone-800 bg-stone-900/90 p-3.5 space-y-1.5">
                  <div className="font-extrabold text-white">
                    {t('ruleSec1PlayersLabel')}
                  </div>
                  <p className="text-stone-300 leading-relaxed text-xs sm:text-sm">
                    {t('ruleSec1PlayersDesc')}
                  </p>
                </div>

                <div className="rounded-xl border border-stone-800 bg-stone-900/90 p-3.5 space-y-2">
                  <div className="font-extrabold text-white">
                    {t('ruleSec1ResourcesLabel')}
                  </div>
                  <p className="text-stone-300 leading-relaxed text-xs sm:text-sm">
                    {t('ruleSec1ResourcesDesc')}
                  </p>
                  {/* 색깔 칩 시각 배지 */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded bg-red-500/25 border border-red-500/50 text-red-200 text-xs font-bold whitespace-nowrap">
                      {tColor('RED')} x2
                    </span>
                    <span className="px-2 py-0.5 rounded bg-green-500/25 border border-green-500/50 text-green-200 text-xs font-bold whitespace-nowrap">
                      {tColor('GREEN')} x2
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/25 border border-blue-500/50 text-blue-200 text-xs font-bold whitespace-nowrap">
                      {tColor('BLUE')} x2
                    </span>
                    <span className="px-2 py-0.5 rounded bg-gradient-to-r from-red-500/40 via-amber-400/40 to-blue-500/40 border border-amber-400/70 text-amber-100 text-xs font-bold whitespace-nowrap">
                      {tColor('RAINBOW')} x1
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-red-500/35 bg-red-950/25 p-3.5 space-y-1.5">
                  <div className="font-extrabold text-red-300">
                    {t('ruleSec1WinLabel')}
                  </div>
                  <p className="text-stone-200 leading-relaxed text-xs sm:text-sm">
                    {t('ruleSec1WinDesc')}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* 섹션 2: 매 라운드 진행 순서 */}
          {showSection2 && (
            <section className="rounded-2xl border border-stone-700/80 bg-stone-950/60 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-2 text-base sm:text-lg font-extrabold text-sky-300">
                <ListOrdered className="w-5 h-5 shrink-0" />
                <h3>{t('ruleSec2Title')}</h3>
              </div>

              <div className="space-y-3 text-sm sm:text-base">
                <div className="rounded-xl border border-stone-800 bg-stone-900/90 p-3.5 space-y-1.5">
                  <div className="font-extrabold text-amber-300">
                    {t('ruleSec2Step1Label')}
                  </div>
                  <p className="text-stone-300 leading-relaxed text-xs sm:text-sm">
                    {t('ruleSec2Step1Desc')}
                  </p>
                </div>

                <div className="rounded-xl border border-stone-800 bg-stone-900/90 p-3.5 space-y-1.5">
                  <div className="font-extrabold text-sky-300">
                    {t('ruleSec2Step2Label')}
                  </div>
                  <p className="text-stone-300 leading-relaxed text-xs sm:text-sm">
                    {t('ruleSec2Step2Desc')}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/35 bg-stone-900/95 p-4 space-y-2.5">
                  <div className="font-extrabold text-white flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{t('ruleSec2Step3Label')}</span>
                  </div>
                  <ul className="space-y-2 text-stone-200 text-xs sm:text-sm leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <span className="px-2 py-0.5 rounded bg-gradient-to-r from-red-500/40 via-amber-400/40 to-blue-500/40 border border-amber-400/70 text-amber-100 text-xs font-extrabold shrink-0">
                        #1
                      </span>
                      <span>{t('ruleSec2Step3Priority1')}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-900 text-xs font-extrabold shrink-0">
                        #2
                      </span>
                      <span>{t('ruleSec2Step3Priority2')}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="px-2 py-0.5 rounded bg-amber-500/25 border border-amber-500/50 text-amber-200 text-xs font-extrabold shrink-0">
                        #3
                      </span>
                      <span>{t('ruleSec2Step3Priority3')}</span>
                    </li>
                  </ul>
                  <div className="pt-2 border-t border-stone-800 text-xs sm:text-sm text-amber-300 font-semibold leading-relaxed">
                    {t('ruleSec2StarterTip')}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 섹션 3: 큐브 배치, 패스(Pass), 13 폭발 정산 */}
          {showSection3 && (
            <section className="rounded-2xl border border-stone-700/80 bg-stone-950/60 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-2 text-base sm:text-lg font-extrabold text-red-300">
                <Flame className="w-5 h-5 shrink-0" />
                <h3>{t('ruleSec3Title')}</h3>
              </div>

              <div className="space-y-3 text-sm sm:text-base">
                {/* 큐브 배치 */}
                <div className="rounded-xl border border-stone-800 bg-stone-900/90 p-3.5 space-y-1.5">
                  <div className="font-extrabold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t('ruleSec3PlaceLabel')}</span>
                  </div>
                  <p className="text-stone-300 leading-relaxed text-xs sm:text-sm">
                    {t('ruleSec3PlaceDesc')}
                  </p>
                </div>

                {/* 패스 규칙 (역순 후배치) */}
                <div className="rounded-xl border border-purple-500/40 bg-purple-950/25 p-3.5 space-y-1.5">
                  <div className="font-extrabold text-purple-200 flex items-center gap-2">
                    <SkipForward className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{t('ruleSec3PassLabel')}</span>
                  </div>
                  <p className="text-stone-200 leading-relaxed text-xs sm:text-sm">
                    {t('ruleSec3PassDesc')}
                  </p>
                </div>

                {/* 13 이상 폭발 및 벌점 (핵심) */}
                <div className="rounded-xl border border-red-500/50 bg-red-950/35 p-4 space-y-2.5">
                  <div className="font-extrabold text-red-200 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                    <span>{t('ruleSec3OverloadLabel')}</span>
                  </div>
                  <p className="text-stone-100 leading-relaxed font-medium text-xs sm:text-sm">
                    {t('ruleSec3OverloadDesc')}
                  </p>
                  <div className="rounded-xl bg-black/50 border border-red-500/35 px-3.5 py-2.5 text-xs sm:text-sm text-amber-200 font-semibold leading-relaxed">
                    {t('ruleSec3OverloadExample')}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 섹션 4: 중간 정산 (7라운드 종료 후) */}
          {showSection4 && (
            <section className="rounded-2xl border border-stone-700/80 bg-stone-950/60 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-2 text-base sm:text-lg font-extrabold text-emerald-300">
                <RefreshCw className="w-5 h-5 shrink-0" />
                <h3>{t('ruleSec4Title')}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm sm:text-base">
                <div className="rounded-xl border border-stone-800 bg-stone-900/90 p-3.5 space-y-1.5">
                  <div className="font-extrabold text-emerald-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{t('ruleSec4HandLabel')}</span>
                  </div>
                  <p className="text-stone-300 leading-relaxed text-xs sm:text-sm">
                    {t('ruleSec4HandDesc')}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/35 bg-amber-950/20 p-3.5 space-y-1.5">
                  <div className="font-extrabold text-amber-300">
                    {t('ruleSec4CarrierLabel')}
                  </div>
                  <p className="text-stone-200 leading-relaxed text-xs sm:text-sm">
                    {t('ruleSec4CarrierDesc')}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* 하단 닫기 푸터 */}
        <div className="px-4 sm:px-6 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] border-t border-stone-800 bg-stone-950/80 flex justify-end shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold py-2.5 px-6 text-sm sm:text-base transition cursor-pointer"
          >
            {t('ruleModalCloseBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
