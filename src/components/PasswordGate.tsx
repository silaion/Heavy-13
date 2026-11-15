// src/components/PasswordGate.tsx
import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import {
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldAlert,
  Sparkles,
  Unlock,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import {
  hasValidAuthToken,
  persistAuthToken,
  verifyPassword,
} from '../utils/cryptoAuth';
import {
  playChipSelect,
  playOverload,
  playTurnAlert,
} from '../utils/soundEffects';
import { LanguageSwitcher } from './LanguageSwitcher';

export interface PasswordGateProps {
  children: ReactNode;
}

export function PasswordGate({ children }: PasswordGateProps) {
  const { t } = useTranslation();

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() =>
    hasValidAuthToken()
  );
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // URL에 ?room=XXXX 초대 쿼리가 포함되어 있는지 감지 (인증 후 리다이렉트 없이 그대로 보존)
  const invitedRoomCode = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return (params.get('room') ?? '').trim().toUpperCase();
  }, []);

  if (isUnlocked) {
    return <>{children}</>;
  }

  const triggerErrorShake = () => {
    setHasError(true);
    setIsShaking(false);
    window.setTimeout(() => {
      setIsShaking(true);
    }, 10);
    window.setTimeout(() => {
      setIsShaking(false);
    }, 600);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isVerifying || !passwordInput.trim()) return;

    setIsVerifying(true);
    setHasError(false);

    const matched = await verifyPassword(passwordInput.trim());
    setIsVerifying(false);

    if (matched) {
      persistAuthToken();
      playTurnAlert();
      setIsUnlocked(true);
    } else {
      playOverload();
      triggerErrorShake();
    }
  };

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-hidden bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center px-3 sm:px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div
        className={`w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/85 backdrop-blur-md p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6 transition-transform overflow-hidden ${
          isShaking ? 'animate-carrier-explode border-red-500/70' : ''
        }`}
      >
        {/* 우측 상단 음소거 토글 & 3개 국어 전환기 */}
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        {/* 상단 석재 자물쇠 엠블럼 및 게임 타이틀 */}
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 rounded-2xl border-2 border-stone-400 bg-stone-200 text-stone-900 shadow-inner flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 stroke-[2.5]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            {t('gameTitlePrefix')} {t('gameTitleNumber')} · {t('gateBadge')}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {t('gateTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            {t('gateDesc')}
          </p>
        </div>

        {/* 초대 링크(?room=XXXX)로 접속한 경우 방 코드 보존 안내 배너 */}
        {invitedRoomCode && (
          <div className="rounded-xl border border-sky-500/40 bg-sky-950/40 px-3.5 py-2.5 text-xs text-sky-200 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{t('gateInviteDetected', { roomCode: invitedRoomCode })}</span>
          </div>
        )}

        {/* 비밀번호 불일치 에러 배너 */}
        {hasError && (
          <div className="rounded-xl border border-red-500/50 bg-red-950/50 px-3.5 py-2.5 text-xs sm:text-sm text-red-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{t('gateErrorInvalid')}</span>
          </div>
        )}

        {/* 비밀번호 입력 폼 (text-base 16px: iOS Safari 자동 확대 방지) */}
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="gate-passcode-input"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-400"
            >
              {t('gateInputLabel')}
            </label>

            <div className="relative">
              <input
                id="gate-passcode-input"
                type={showPassword ? 'text' : 'password'}
                autoFocus
                autoComplete="current-password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (hasError) setHasError(false);
                }}
                placeholder={t('gateInputPlaceholder')}
                className={`w-full min-h-[48px] rounded-xl border bg-zinc-950/90 pl-4 pr-11 py-3 text-base text-white placeholder-zinc-500 focus:outline-none transition ${
                  hasError
                    ? 'border-red-500/70 focus:border-red-400'
                    : 'border-zinc-700 focus:border-amber-400'
                }`}
              />

              <button
                type="button"
                onClick={() => {
                  playChipSelect();
                  setShowPassword((prev) => !prev);
                }}
                title={
                  showPassword ? t('gateHidePassword') : t('gateShowPassword')
                }
                aria-label={
                  showPassword ? t('gateHidePassword') : t('gateShowPassword')
                }
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70 transition cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isVerifying || !passwordInput.trim()}
            className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-extrabold py-3.5 px-5 text-sm sm:text-base shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Unlock className="w-4 h-4" />
            {isVerifying ? t('gateVerifyingBtn') : t('gateSubmitBtn')}
          </button>
        </form>
      </div>
    </div>
  );
}
