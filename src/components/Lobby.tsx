// src/components/Lobby.tsx
import { useState } from 'react';
import {
  Bot,
  Check,
  Copy,
  Crown,
  Link2,
  LogOut,
  Play,
  ShieldAlert,
  Sparkles,
  User,
  Users,
  Wifi,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { useGameStore } from '../store/useGameStore';
import { LanguageSwitcher } from './LanguageSwitcher';

export interface LobbyProps {
  initialRoomCode?: string;
  isInitializing: boolean;
  onCreateRoom: (hostName: string) => void;
  onJoinRoom: (roomCode: string, guestName: string) => void;
  onLeaveRoom: () => void;
}

export function Lobby({
  initialRoomCode = '',
  isInitializing,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
}: LobbyProps) {
  const { t, tPlayerName, tError } = useTranslation();

  const role = useGameStore((s) => s.role);
  const viewState = useGameStore((s) => s.viewState);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const connectionError = useGameStore((s) => s.connectionError);
  const startHostGame = useGameStore((s) => s.startHostGame);

  const [playerName, setPlayerName] = useState<string>('');
  const [joinCodeInput, setJoinCodeInput] = useState<string>(initialRoomCode);
  const [copiedType, setCopiedType] = useState<'CODE' | 'LINK' | null>(null);

  const localizedConnectionError = tError(connectionError);

  const handleCopy = async (type: 'CODE' | 'LINK') => {
    if (!viewState) return;
    const textToCopy =
      type === 'CODE'
        ? viewState.roomCode
        : `${window.location.origin}${window.location.pathname}?room=${viewState.roomCode}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      // 클립보드 권한 실패 시 무시
    }
  };

  // 아직 방을 생성하거나 입장하지 않은 초기 진입 화면
  if (role === 'NONE' || !viewState) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-md p-6 sm:p-8 shadow-2xl space-y-6">
          {/* 우측 상단 언어 전환 스위치 */}
          <div className="flex justify-end">
            <LanguageSwitcher />
          </div>

          {/* 타이틀 헤더 */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              {t('gameBadge')}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {t('gameTitlePrefix')}{' '}
              <span className="text-amber-400">{t('gameTitleNumber')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {t('gameSubtitleLine1')}
              <br />
              {t('gameSubtitleLine2')}
            </p>
          </div>

          {/* 에러 배너 */}
          {localizedConnectionError && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/50 p-3.5 flex items-start gap-2.5 text-xs sm:text-sm text-red-200">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{localizedConnectionError}</span>
            </div>
          )}

          {/* 닉네임 입력 */}
          <div className="space-y-2">
            <label
              htmlFor="player-name"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-400"
            >
              {t('nicknameLabel')}
            </label>
            <input
              id="player-name"
              type="text"
              maxLength={14}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder={t('nicknamePlaceholder')}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/90 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* 방 만들기 (Host) */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Crown className="w-4 h-4" />
                  {t('createRoomTitle')}
                </div>
                <p className="text-xs text-zinc-400">{t('createRoomDesc')}</p>
              </div>
              <button
                type="button"
                disabled={isInitializing}
                onClick={() =>
                  onCreateRoom(playerName.trim() || t('defaultHostName'))
                }
                className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold py-3 px-4 text-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Crown className="w-4 h-4" />
                {isInitializing ? t('initializingP2P') : t('createRoomBtn')}
              </button>
            </div>

            {/* 코드로 입장 (Guest) */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                  <Users className="w-4 h-4" />
                  {t('joinRoomTitle')}
                </div>
                <input
                  type="text"
                  maxLength={8}
                  value={joinCodeInput}
                  onChange={(e) =>
                    setJoinCodeInput(e.target.value.toUpperCase())
                  }
                  placeholder={t('joinRoomPlaceholder')}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono uppercase tracking-widest text-center text-white placeholder-zinc-500 focus:border-sky-400 focus:outline-none"
                />
              </div>
              <button
                type="button"
                disabled={isInitializing || joinCodeInput.trim().length < 4}
                onClick={() =>
                  onJoinRoom(
                    joinCodeInput.trim(),
                    playerName.trim() || t('defaultGuestName')
                  )
                }
                className="w-full rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-zinc-950 font-bold py-3 px-4 text-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wifi className="w-4 h-4" />
                {isInitializing ? t('connectingP2P') : t('joinRoomBtn')}
              </button>
            </div>
          </div>

          {/* 핵심 규칙 요약 */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4 space-y-1.5 text-xs text-zinc-400">
            <div className="font-semibold text-zinc-300">
              {t('rulesSummaryTitle')}
            </div>
            <ul className="list-disc list-inside space-y-1">
              <li>{t('rulesSummaryItem1')}</li>
              <li>{t('rulesSummaryItem2')}</li>
              <li>{t('rulesSummaryItem3')}</li>
              <li>{t('rulesSummaryItem4')}</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 방 생성/입장 후 7인 슬롯 대기실 화면
  const humanCount = viewState.players.filter((p) => !p.isBot).length;
  const botCount = viewState.players.filter((p) => p.isBot).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900/85 backdrop-blur-md p-6 sm:p-8 shadow-2xl space-y-6">
        {/* 우측 상단 언어 전환 스위치 */}
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        {/* 상단 방 코드 및 초대 컨트롤 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {t('waitingRoomBadge')}
              </span>
              <span className="text-xs text-zinc-400">
                {t('waitingRoomCounts', { humanCount, botCount })}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2">
              {t('roomCodeLabel')}{' '}
              <span className="font-mono tracking-widest text-amber-400">
                {viewState.roomCode}
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCopy('CODE')}
              className="rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 px-3.5 py-2 text-xs font-semibold text-zinc-100 flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedType === 'CODE' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  {t('codeCopiedBtn')}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-400" />
                  {t('copyCodeBtn')}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => void handleCopy('LINK')}
              className="rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2 text-xs font-semibold text-amber-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedType === 'LINK' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  {t('linkCopiedBtn')}
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  {t('copyLinkBtn')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* 7인 슬롯 프리뷰 그리드 */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-zinc-400">
            <span>{t('slotStatusHeader')}</span>
            <span>{t('slotStatusSub')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {viewState.players.map((slot) => {
              const isMe = slot.id === myPlayerId;
              const displayName = tPlayerName(slot);
              return (
                <div
                  key={slot.slotIndex}
                  className={`rounded-2xl border p-3.5 flex items-center justify-between transition ${
                    isMe
                      ? 'border-amber-500/60 bg-amber-500/10'
                      : slot.isBot
                        ? 'border-zinc-800 bg-zinc-950/50 text-zinc-400'
                        : 'border-sky-500/40 bg-sky-500/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        slot.isHost
                          ? 'bg-amber-500 text-zinc-950'
                          : slot.isBot
                            ? 'bg-zinc-800 text-zinc-400'
                            : 'bg-sky-500 text-zinc-950'
                      }`}
                    >
                      {slot.isHost ? (
                        <Crown className="w-4 h-4" />
                      ) : slot.isBot ? (
                        <Bot className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white truncate">
                          {displayName}
                        </span>
                        {isMe && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-zinc-950">
                            {t('meBadge')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {t('slotNumberLabel', { index: slot.slotIndex + 1 })} ·{' '}
                        {slot.isHost
                          ? t('roleHostLabel')
                          : slot.isBot
                            ? t('roleBotLabel')
                            : t('roleHumanLabel')}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                      slot.isBot
                        ? 'bg-zinc-800 text-zinc-300'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {slot.isBot ? t('statusBotReady') : t('statusConnected')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onLeaveRoom}
            className="w-full sm:w-auto rounded-xl border border-zinc-700 hover:bg-zinc-800 px-4 py-3 text-xs sm:text-sm font-semibold text-zinc-300 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {t('leaveRoomBtn')}
          </button>

          {role === 'HOST' ? (
            <button
              type="button"
              onClick={startHostGame}
              className="w-full sm:flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold py-3.5 px-6 text-sm sm:text-base shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              {t('startGameBtn')}
            </button>
          ) : (
            <div className="w-full sm:flex-1 rounded-xl border border-sky-500/30 bg-sky-950/30 py-3 px-4 text-center text-xs sm:text-sm text-sky-200 font-medium">
              {t('waitingForHostStart')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
