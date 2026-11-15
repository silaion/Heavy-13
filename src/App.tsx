// src/App.tsx
import { useEffect, useMemo } from 'react';
import { GameBoard } from './components/GameBoard';
import { Lobby } from './components/Lobby';
import { PasswordGate } from './components/PasswordGate';
import { PlayerHand } from './components/PlayerHand';
import { useTranslation } from './i18n/useTranslation';
import { usePeerRoom } from './network/usePeerRoom';
import { useGameStore } from './store/useGameStore';

function GameContent() {
  const { isInitializing, createRoomAsHost, joinRoomAsGuest, disconnectRoom } =
    usePeerRoom();

  const role = useGameStore((s) => s.role);
  const viewState = useGameStore((s) => s.viewState);

  // URL 쿼리 파라미터(?room=ABCDEF)에서 초대 방 코드 자동 추출
  // PasswordGate 통과 후에도 리다이렉트 없이 그대로 유지되어 즉시 해당 방 코드가 입력란에 채워짐
  const initialRoomCode = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return (params.get('room') ?? '').trim().toUpperCase();
  }, []);

  if (role === 'NONE' || !viewState || viewState.phase === 'LOBBY') {
    return (
      <Lobby
        initialRoomCode={initialRoomCode}
        isInitializing={isInitializing}
        onCreateRoom={(hostName) => createRoomAsHost(hostName)}
        onJoinRoom={(roomCode, guestName) => joinRoomAsGuest(roomCode, guestName)}
        onLeaveRoom={disconnectRoom}
      />
    );
  }

  return (
    <div className="h-dvh max-h-dvh w-full max-w-full bg-zinc-950 text-zinc-100 flex flex-col justify-between overflow-hidden overflow-x-hidden select-none">
      <GameBoard onLeaveRoom={disconnectRoom} />
      <PlayerHand />
    </div>
  );
}

export function App() {
  const { language, t } = useTranslation();

  // 선택된 언어에 따라 브라우저 탭 타이틀 및 html lang 속성 즉시 동기화
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = `${t('gameTitlePrefix')} ${t('gameTitleNumber')} — ${t('gameBadge')}`;
  }, [language, t]);

  return (
    <PasswordGate>
      <GameContent />
    </PasswordGate>
  );
}

export default App;
