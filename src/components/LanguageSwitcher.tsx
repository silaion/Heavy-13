// src/components/LanguageSwitcher.tsx
import { Globe, Volume2, VolumeX } from 'lucide-react';
import { type Language } from '../i18n/translations';
import { useTranslation } from '../i18n/useTranslation';
import { playChipSelect, useSoundStore } from '../utils/soundEffects';

const LANGUAGE_OPTIONS: readonly { code: Language; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'EN' },
  { code: 'ja', label: '日本語' },
];

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();
  const isMuted = useSoundStore((s) => s.isMuted);
  const toggleMute = useSoundStore((s) => s.toggleMute);

  const handleToggleMute = () => {
    const wasMuted = isMuted;
    toggleMute();
    // 음소거 해제 시 즉시 가벼운 클릭 피드백 사운드 재생
    if (wasMuted) {
      setTimeout(() => playChipSelect(), 10);
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      {/* 사운드 음소거(Mute) 토글 버튼 */}
      <button
        type="button"
        onClick={handleToggleMute}
        title={isMuted ? t('soundUnmuteTooltip') : t('soundMuteTooltip')}
        aria-label={isMuted ? t('soundUnmuteTooltip') : t('soundMuteTooltip')}
        className={`rounded-xl border p-2 transition cursor-pointer select-none flex items-center justify-center ${
          isMuted
            ? 'border-zinc-800 bg-zinc-900/90 text-zinc-500 hover:text-zinc-300'
            : 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
        }`}
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </button>

      {/* 다국어(ko / en / ja) 선택 버튼 그룹 */}
      <div
        role="group"
        aria-label="Language Switcher"
        className="inline-flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/90 p-1 shadow-sm"
      >
        <Globe className="w-3.5 h-3.5 text-zinc-400 ml-1.5 mr-0.5 shrink-0" />
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
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
                isActive
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
