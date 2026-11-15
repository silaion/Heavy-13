// src/components/LanguageSwitcher.tsx
import { Globe, Volume2, VolumeX } from 'lucide-react';
import { type Language } from '../i18n/translations';
import { useTranslation } from '../i18n/useTranslation';
import { playChipSelect, useSoundStore } from '../utils/soundEffects';

const LANGUAGE_OPTIONS: readonly {
  code: Language;
  shortLabel: string;
  fullLabel: string;
}[] = [
  { code: 'ko', shortLabel: 'KO', fullLabel: '한국어' },
  { code: 'en', shortLabel: 'EN', fullLabel: 'EN' },
  { code: 'ja', shortLabel: 'JA', fullLabel: '日本語' },
];

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();
  const isMuted = useSoundStore((s) => s.isMuted);
  const toggleMute = useSoundStore((s) => s.toggleMute);

  const handleToggleMute = () => {
    const wasMuted = isMuted;
    toggleMute();
    if (wasMuted) {
      setTimeout(() => playChipSelect(), 10);
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5 shrink-0">
      {/* 사운드 음소거(Mute) 토글 버튼 */}
      <button
        type="button"
        onClick={handleToggleMute}
        title={isMuted ? t('soundUnmuteTooltip') : t('soundMuteTooltip')}
        aria-label={isMuted ? t('soundUnmuteTooltip') : t('soundMuteTooltip')}
        className={`min-h-[36px] px-2.5 rounded-xl border transition cursor-pointer select-none flex items-center justify-center shrink-0 ${
          isMuted
            ? 'border-zinc-800 bg-zinc-900/90 text-zinc-500 hover:text-zinc-300'
            : 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
        }`}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5" />
        ) : (
          <Volume2 className="w-5 h-5" />
        )}
      </button>

      {/* 다국어(ko / en / ja) 선택 버튼 그룹 */}
      <div
        role="group"
        aria-label="Language Switcher"
        className="inline-flex items-center gap-0.5 rounded-xl border border-zinc-800 bg-zinc-900/90 p-0.5 shadow-sm shrink-0"
      >
        <Globe className="hidden md:inline-block w-4 h-4 text-zinc-400 ml-1.5 mr-0.5 shrink-0" />
        {LANGUAGE_OPTIONS.map((opt) => {
          const isActive = language === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => {
                playChipSelect();
                setLanguage(opt.code);
              }}
              className={`min-h-[36px] px-2.5 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer select-none whitespace-nowrap flex items-center justify-center ${
                isActive
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/70'
              }`}
            >
              <span className="sm:hidden">{opt.shortLabel}</span>
              <span className="hidden sm:inline">{opt.fullLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
