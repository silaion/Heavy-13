// src/i18n/translations.ts
import type { CarrierColor, ChipColor, GameLogEntry } from '../types/game';

export type Language = 'ko' | 'en' | 'ja';

export const SUPPORTED_LANGUAGES: readonly Language[] = ['ko', 'en', 'ja'];
export const LANGUAGE_STORAGE_KEY = 'heavy13_lang';

const ko = {
  // Game Title & Common
  gameBadge: '데블스 플랜: 데드 어게인',
  gameTitlePrefix: '무거운',
  gameTitleNumber: '13',
  gameSubtitleLine1:
    '바위 카드(0~6)와 색깔 칩을 조합해 받침대 합계가 13 이상이 되지 않도록 생존하세요.',
  gameSubtitleLine2:
    '빈 슬롯은 로컬 AI 봇이 자동으로 채워 언제나 7인 매치로 진행됩니다.',
  soundMuteTooltip: '효과음 끄기 (음소거)',
  soundUnmuteTooltip: '효과음 켜기',

  // Password Gate
  gateBadge: 'PRIVATE ACCESS GATE',
  gateTitle: '접근 암호 입력',
  gateDesc:
    '이 게임 룸에 입장하려면 초대받은 접근 비밀번호를 입력해 주세요.',
  gateInputLabel: '접근 비밀번호 (Passcode)',
  gateInputPlaceholder: '비밀번호를 입력하세요',
  gateShowPassword: '비밀번호 표시',
  gateHidePassword: '비밀번호 숨기기',
  gateSubmitBtn: '잠금 해제 및 입장',
  gateVerifyingBtn: '검증 중...',
  gateErrorInvalid: '비밀번호가 일치하지 않습니다. 다시 확인해 주세요.',
  gateInviteDetected: '초대 방 코드({roomCode})가 감지되었습니다. 잠금 해제 후 즉시 연결됩니다.',

  // Colors & Chips
  color_RED: '빨강',
  color_GREEN: '초록',
  color_BLUE: '파랑',
  color_RAINBOW: '레인보우',
  chipBadge_RED: '빨강 칩',
  chipBadge_GREEN: '초록 칩',
  chipBadge_BLUE: '파랑 칩',
  chipBadge_RAINBOW: '레인보우 칩',
  carrierName_RED: '빨강 (RED) 받침대',
  carrierName_GREEN: '초록 (GREEN) 받침대',
  carrierName_BLUE: '파랑 (BLUE) 받침대',

  // Default Names
  defaultHostName: '호스트',
  defaultGuestName: '게스트',
  defaultPlayerName: '플레이어 {index}',
  botName_1: 'AI 알파',
  botName_2: 'AI 베타',
  botName_3: 'AI 감마',
  botName_4: 'AI 델타',
  botName_5: 'AI 엡실론',
  botName_6: 'AI 제타',
  botName_7: 'AI 에타',
  botTakeoverSuffix: '{name} (AI)',

  // Lobby - Initial Screen
  nicknameLabel: '플레이어 닉네임',
  nicknamePlaceholder: '닉네임 입력 (미입력 시 자동 지정)',
  createRoomTitle: '새로운 방 만들기 (Host)',
  createRoomDesc:
    '방을 개설하고 초대 코드나 링크로 친구를 초대하거나 AI 봇과 즉시 시작합니다.',
  createRoomBtn: '방 생성하기',
  initializingP2P: 'P2P 초기화 중...',
  joinRoomTitle: '방 코드로 참가 (Guest)',
  joinRoomPlaceholder: '6자리 코드 (예: AB12CD)',
  joinRoomBtn: '방 입장하기',
  connectingP2P: '연결 중...',
  rulesSummaryTitle: '게임 규칙 요약 (총 14라운드)',
  rulesSummaryItem1:
    '전반부(1~7R) 시작 시 바위 카드 0~6(7장)과 색깔 칩 빨강·초록·파랑 각 2개, 레인보우 1개 지급',
  rulesSummaryItem2:
    '7라운드 종료 시 손패(카드·칩)만 초기 자원으로 전량 재지급되며, 받침대에 쌓인 돌은 그대로 유지',
  rulesSummaryItem3:
    '받침대의 돌과 합계는 오직 합계가 13 이상이 되어 폭발할 때만 벌점 부과 후 0으로 리셋',
  rulesSummaryItem4: '14라운드 종료 후 누적 벌점 최하위 2명 최종 탈락',

  // Lobby - Waiting Room
  waitingRoomBadge: '7인 매치 대기실',
  waitingRoomCounts: '인간 {humanCount}명 · AI 봇 {botCount}명',
  roomCodeLabel: '방 코드:',
  copyCodeBtn: '코드 복사',
  codeCopiedBtn: '코드 복사됨',
  copyLinkBtn: '원클릭 초대 링크 복사',
  linkCopiedBtn: '초대 링크 복사됨',
  slotStatusHeader: '슬롯 현황 (총 7석 고정)',
  slotStatusSub:
    '새로운 플레이어가 입장하면 AI 봇 슬롯이 인간 슬롯으로 자동 전환됩니다',
  meBadge: '나',
  slotNumberLabel: '슬롯 #{index}',
  roleHostLabel: '방장 (Host)',
  roleBotLabel: '로컬 휴리스틱 AI',
  roleHumanLabel: '인간 플레이어 (P2P)',
  statusBotReady: 'AI 대기',
  statusConnected: '접속 완료',
  leaveRoomBtn: '방 나가기',
  startGameBtn: '7인 매치 게임 시작 (14라운드)',
  waitingForHostStart: '호스트가 게임을 시작하기를 기다리는 중입니다...',

  // GameBoard - Header & Player Cards
  roundBadge: 'ROUND {round} / {maxRounds}',
  firstHalfLabel: '전반부 (1~7R)',
  secondHalfLabel: '후반부 (8~14R)',
  currentTurnLabel: '현재 턴:',
  leaveBtnShort: '나가기',
  penaltyBadge: '벌점 {points}',
  remainingCardsLabel: '남은 카드',
  remainingCardsUnit: '{count}장',
  remainingChipsLabel: '남은 칩',
  remainingChipsUnit: '{count}개',
  starterBadge: '선(先)',
  passWaitingBadge: '패스 대기',
  actedDoneBadge: '제출 완료',
  botThinkingStatus: 'AI 생각 중...',
  turnActiveStatus: '턴 진행 중',

  // GameBoard - 3-Color Carrier Pillars
  carrierSectionTitle: '3색 짐꾼 받침대 (받침대)',
  carrierSectionDesc:
    '제출된 돌(숫자 타일)은 각 받침대 위 1층 왼쪽 → 1층 오른쪽 → 2층 왼쪽 순서로 쌓이며, 합계가 13 이상이 되면 13 폭발합니다.',
  lastSubmittedLabel: '직전 제출:',
  lastSubmittedFormat: '{playerName} → [{carrier}] 받침대에 돌 [{card}] ({chip})',
  pillarIdleBadge: '대기',
  pillarExplodingStatus: '💥 13 폭발!',
  pillarDangerStatus: '위험 (폭발 임박)',
  pillarWarningStatus: '주의 구간',
  pillarStonesCountStatus: '돌 {count}개 적재',
  stoneTileTooltip: '{playerName} ({chip})',
  rainbowStoneTooltip: '레인보우 칩으로 배치됨',
  lastExplosionBanner:
    '최근 폭발({round}R · [{carrier}] 받침대): {playerName}님이 합계 {finalSum}로 벌점 +{penalty}점을 받고 받침대가 0으로 리셋되었습니다.',
  liveLogTitle: '실시간 진행 기록',
  liveLogRecentCount: '최근 30건',

  // GameBoard - Modals (Half-time & Game Over)
  halfTimeTitle: '전반부(1~7라운드) 중간 정산',
  halfTimeDesc:
    '손패(바위 카드 7장·색깔 칩 7개)만 전량 새로 재지급되며, 3개 받침대에 쌓인 돌과 현재 합계는 그대로 유지됩니다.',
  halfTimeScoreHeader: '중간 누적 벌점 현황',
  penaltyPointsValue: '벌점 {points}점',
  startSecondHalfBtn: '후반부 (8~14라운드) 시작하기',
  waitingForHostSecondHalf: '호스트가 후반부를 시작하기를 기다리는 중입니다...',
  gameOverBadge: '14라운드 최종 종료',
  gameOverTitle: '최종 순위 및 탈락자 판정',
  gameOverDesc: '누적 벌점이 가장 많은 최하위 2명이 최종 탈락합니다.',
  eliminatedBadge: '최종 탈락',
  backToLobbyBtn: '대기실로 복귀 (재경기)',

  // PlayerHand
  myTurnPrompt:
    '나의 턴 — 제출할 바위 카드(0~6) 1장과 색깔 칩 1개를 선택하세요',
  otherTurnPrompt: '다른 플레이어의 턴이 진행 중입니다 (내 손패 미리보기)',
  projectedSumPreview:
    '[{carrier}] 예상 합계: {currentSum} + {card} = {projectedSum} {status}',
  projectedStatusExplode: '💥 (13 폭발!)',
  projectedStatusSafe: '(안전)',
  handCardsHeader: '보유 바위 카드 ({count}장)',
  handCardsHintWithTarget:
    '[{carrier}] 받침대(현재 {sum}) 기준 폭발 여부 표시 중',
  handCardsHintNoTarget: '칩을 선택하면 해당 받침대 기준 폭발 여부가 표시됩니다',
  cardTileBlastLabel: '13 폭발!',
  cardTileNormalLabel: '바위 카드',
  handChipsHeader: '보유 색깔 칩 ({count}개)',
  handChipsHint: '선택한 칩 색상의 받침대 위에 돌이 올라갑니다',
  chipCarrierSumShort: '(합:{sum})',
  selectedBadge: '선택됨',
  rainbowTargetPrompt:
    '레인보우 칩 대상 받침대 선택 — 어느 색깔 받침대에 돌을 올리시겠습니까?',
  rainbowTargetSub: '현재 합: {sum} / 13 (돌 {count}개)',
  passTurnBtn: '패스 (라운드 1회)',
  submitComboBtnActive: '[{carrier}] 받침대에 바위 [{card}] ({chip}) 제출',
  submitComboBtnDisabled: '제출할 바위 카드와 색깔 칩을 선택하세요',

  // Validation & Error Codes
  err_ALREADY_PLAYING: '이미 진행 중인 게임에는 신규 입장할 수 없습니다.',
  err_ROOM_FULL: '7인 슬롯이 모두 인간 플레이어로 가득 찼습니다.',
  err_TARGET_NOT_FOUND: '대상 플레이어를 찾을 수 없습니다.',
  err_NOT_HALF_TIME: '중간 정산 단계가 아닙니다.',
  err_NOT_PLAYING: '현재 게임 진행 중이 아닙니다.',
  err_NOT_YOUR_TURN: '본인의 턴이 아닙니다.',
  err_PLAYER_NOT_FOUND: '플레이어 정보가 존재하지 않습니다.',
  err_CANNOT_PASS:
    '이번 라운드에서는 이미 패스를 사용했거나 패스할 수 없는 상태입니다.',
  err_CARD_NOT_OWNED: '보유하지 않은 바위 카드입니다.',
  err_CHIP_NOT_OWNED: '보유하지 않은 색깔 칩입니다.',
  err_RAINBOW_TARGET_REQUIRED:
    '레인보우 칩 사용 시 돌을 올릴 대상 받침대(빨강·초록·파랑)를 선택해야 합니다.',
  err_UNKNOWN_ACTION: '알 수 없는 액션입니다.',
  err_NO_HOST_SESSION: '호스트 세션이 활성화되어 있지 않습니다.',
  err_NO_HOST_PERMISSION: '호스트 권한이 없습니다.',
  err_SELECT_BOTH_REQUIRED:
    '제출할 바위 카드 1장과 색깔 칩 1개를 모두 선택해 주세요.',
  err_P2P_DISCONNECTED: '호스트와의 P2P 데이터 채널이 연결되어 있지 않습니다.',
  err_SESSION_NOT_INIT: '세션이 초기화되지 않았습니다.',
  err_SENDER_MISMATCH: '발신자 ID 검증에 실패했습니다.',
  err_HOST_LOST: '호스트와의 연결이 종료되었습니다.',
  err_HOST_PEER_ERROR: '호스트 P2P 오류가 발생했습니다: {detail}',
  err_JOIN_FAILED:
    '방 접속 실패 ({roomCode}): 호스트를 찾을 수 없거나 네트워크 오류가 발생했습니다. ({detail})',

  // Structured Event Logs
  log_LOBBY_CREATED:
    '로비가 생성되었습니다. 빈 슬롯은 자동으로 AI 봇이 채웁니다.',
  log_GAME_STARTED:
    '전반부(1~7라운드)가 시작되었습니다! 전원에게 바위 카드 7장(0~6)과 색깔 칩 7개가 지급되었습니다.',
  log_ROUND_STARTED: '제 {round}라운드가 시작되었습니다. 선플레이어: {playerName}',
  log_SECOND_HALF_STARTED:
    '후반부 제 {round}라운드가 시작되었습니다! 선플레이어: {playerName}',
  log_HALF_TIME_REACHED:
    '전반부(7라운드)가 종료되었습니다! 손패(바위 카드 7장·칩 7개)만 전량 재지급되며, 받침대에 쌓인 돌과 합계는 그대로 유지됩니다.',
  log_PASS_TURN:
    '{playerName}님이 턴을 패스했습니다. (일반 턴 종료 후 역순으로 제출합니다)',
  log_SUBMIT_NORMAL:
    '{playerName}님이 [{carrier}] 받침대에 바위 [{card}]을(를) 제출했습니다. (합계: {previousSum} → {newSum})',
  log_SUBMIT_RAINBOW:
    '{playerName}님이 레인보우 칩으로 [{carrier}] 받침대에 바위 [{card}]을(를) 제출했습니다. (합계: {previousSum} → {newSum})',
  log_EXPLOSION:
    '💥 [{carrier}] 받침대 13 폭발! 합계가 {newSum}(>= 13)에 도달하여 {playerName}님이 벌점 +{penaltyAdded}점을 받고 [{carrier}] 받침대가 0으로 리셋되었습니다!',
  log_BOT_TAKEOVER:
    '{playerName}님의 연결이 끊어져 로컬 AI 봇이 즉시 슬롯을 인계받았습니다.',
  log_GAME_OVER:
    '14라운드 최종 종료! 누적 벌점 최하위 2명 탈락: {eliminatedList}',
  log_ELIMINATED_ITEM: '{name}(벌점 {points}점)',
};

export type TranslationSchema = Record<keyof typeof ko, string>;
export type TranslationKey = keyof typeof ko;

const en: TranslationSchema = {
  // Game Title & Common
  gameBadge: "The Devil's Plan: Death Room",
  gameTitlePrefix: 'Heavy',
  gameTitleNumber: '13',
  gameSubtitleLine1:
    'Combine Stone Cards (0–6) and Color Chips without pushing any Carrier sum to 13 or higher.',
  gameSubtitleLine2:
    'Empty slots are automatically filled by local AI bots for a full 7-player match.',
  soundMuteTooltip: 'Mute sound effects',
  soundUnmuteTooltip: 'Unmute sound effects',

  // Password Gate
  gateBadge: 'PRIVATE ACCESS GATE',
  gateTitle: 'Enter Access Passcode',
  gateDesc:
    'Please enter the invited access passcode to enter this game lounge.',
  gateInputLabel: 'Access Passcode',
  gateInputPlaceholder: 'Enter passcode',
  gateShowPassword: 'Show passcode',
  gateHidePassword: 'Hide passcode',
  gateSubmitBtn: 'Unlock & Enter',
  gateVerifyingBtn: 'Verifying...',
  gateErrorInvalid: 'Incorrect passcode. Please try again.',
  gateInviteDetected:
    'Invite room code ({roomCode}) detected. You will proceed right after unlocking.',

  // Colors & Chips
  color_RED: 'Red',
  color_GREEN: 'Green',
  color_BLUE: 'Blue',
  color_RAINBOW: 'Rainbow',
  chipBadge_RED: 'Red Chip',
  chipBadge_GREEN: 'Green Chip',
  chipBadge_BLUE: 'Blue Chip',
  chipBadge_RAINBOW: 'Rainbow Chip',
  carrierName_RED: 'Red Carrier',
  carrierName_GREEN: 'Green Carrier',
  carrierName_BLUE: 'Blue Carrier',

  // Default Names
  defaultHostName: 'Host',
  defaultGuestName: 'Guest',
  defaultPlayerName: 'Player {index}',
  botName_1: 'AI Alpha',
  botName_2: 'AI Beta',
  botName_3: 'AI Gamma',
  botName_4: 'AI Delta',
  botName_5: 'AI Epsilon',
  botName_6: 'AI Zeta',
  botName_7: 'AI Eta',
  botTakeoverSuffix: '{name} (AI)',

  // Lobby - Initial Screen
  nicknameLabel: 'Player Nickname',
  nicknamePlaceholder: 'Enter nickname (auto-assigned if blank)',
  createRoomTitle: 'Create New Room (Host)',
  createRoomDesc:
    'Host a room and invite friends via code/link, or start immediately with AI bots.',
  createRoomBtn: 'Create Room',
  initializingP2P: 'Initializing P2P...',
  joinRoomTitle: 'Join with Room Code (Guest)',
  joinRoomPlaceholder: '6-digit code (e.g. AB12CD)',
  joinRoomBtn: 'Join Room',
  connectingP2P: 'Connecting...',
  rulesSummaryTitle: 'Game Rules Summary (14 Rounds)',
  rulesSummaryItem1:
    '1st Half (R1–7): Everyone receives 7 Stone Cards (0–6) and 7 Chips (2 Red, 2 Green, 2 Blue, 1 Rainbow).',
  rulesSummaryItem2:
    'After Round 7, only player hands (cards & chips) are replenished; stones stacked on the Carriers remain intact.',
  rulesSummaryItem3:
    'A Carrier only resets to 0 when its sum reaches 13+ (Overload!) and awards penalty points.',
  rulesSummaryItem4:
    'After Round 14, the 2 players with the most penalty points are eliminated.',

  // Lobby - Waiting Room
  waitingRoomBadge: '7-Player Lobby',
  waitingRoomCounts: 'Humans: {humanCount} · AI Bots: {botCount}',
  roomCodeLabel: 'Room Code:',
  copyCodeBtn: 'Copy Code',
  codeCopiedBtn: 'Code Copied',
  copyLinkBtn: 'Copy Invite Link',
  linkCopiedBtn: 'Invite Link Copied',
  slotStatusHeader: 'Player Slots (7 Fixed Seats)',
  slotStatusSub:
    'When a human player joins, an AI bot slot automatically switches to a human slot.',
  meBadge: 'ME',
  slotNumberLabel: 'Slot #{index}',
  roleHostLabel: 'Room Host',
  roleBotLabel: 'Local Heuristic AI',
  roleHumanLabel: 'Human Player (P2P)',
  statusBotReady: 'AI Ready',
  statusConnected: 'Connected',
  leaveRoomBtn: 'Leave Room',
  startGameBtn: 'Start 7-Player Match (14 Rounds)',
  waitingForHostStart: 'Waiting for the Host to start the match...',

  // GameBoard - Header & Player Cards
  roundBadge: 'ROUND {round} / {maxRounds}',
  firstHalfLabel: '1st Half (R1–7)',
  secondHalfLabel: '2nd Half (R8–14)',
  currentTurnLabel: 'Current Turn:',
  leaveBtnShort: 'Leave',
  penaltyBadge: 'Penalty {points}',
  remainingCardsLabel: 'Stone Cards',
  remainingCardsUnit: '{count}',
  remainingChipsLabel: 'Chips',
  remainingChipsUnit: '{count}',
  starterBadge: '1st',
  passWaitingBadge: 'Passed',
  actedDoneBadge: 'Submitted',
  botThinkingStatus: 'AI Thinking...',
  turnActiveStatus: 'Playing Turn',

  // GameBoard - 3-Color Carrier Pillars
  carrierSectionTitle: '3-Color Carriers',
  carrierSectionDesc:
    'Submitted stones stack 2-wide (Row 1 Left → Row 1 Right → Row 2 Left). Reaching 13+ triggers an Overload (13+)!',
  lastSubmittedLabel: 'Last Move:',
  lastSubmittedFormat:
    '{playerName} → Stone [{card}] on [{carrier}] Carrier ({chip})',
  pillarIdleBadge: 'Idle',
  pillarExplodingStatus: '💥 Overload (13+)!',
  pillarDangerStatus: 'Danger (10–12)',
  pillarWarningStatus: 'Caution (7–9)',
  pillarStonesCountStatus: '{count} Stones',
  stoneTileTooltip: '{playerName} ({chip})',
  rainbowStoneTooltip: 'Placed with Rainbow Chip',
  lastExplosionBanner:
    'Last Overload (R{round} · [{carrier}] Carrier): {playerName} hit {finalSum} (+{penalty} penalty pts) and reset the Carrier to 0.',
  liveLogTitle: 'Live Match Log',
  liveLogRecentCount: 'Last 30 events',

  // GameBoard - Modals (Half-time & Game Over)
  halfTimeTitle: 'Half-Time Settlement (End of R7)',
  halfTimeDesc:
    'Only player hands (7 Stone Cards & 7 Color Chips) are replenished for the 2nd Half (R8–14). Stones stacked on the 3 Carriers and their sums remain unchanged.',
  halfTimeScoreHeader: 'Current Penalty Standings',
  penaltyPointsValue: '{points} pts',
  startSecondHalfBtn: 'Start 2nd Half (Rounds 8–14)',
  waitingForHostSecondHalf: 'Waiting for the Host to start the 2nd Half...',
  gameOverBadge: 'Round 14 Complete',
  gameOverTitle: 'Final Standings & Eliminations',
  gameOverDesc:
    'The bottom 2 players with the highest cumulative penalty points are eliminated.',
  eliminatedBadge: 'ELIMINATED',
  backToLobbyBtn: 'Return to Lobby (Rematch)',

  // PlayerHand
  myTurnPrompt:
    'Your Turn — Select 1 Stone Card (0–6) and 1 Color Chip to submit',
  otherTurnPrompt: "Another player's turn is in progress (Hand Preview)",
  projectedSumPreview:
    '[{carrier}] Projected: {currentSum} + {card} = {projectedSum} {status}',
  projectedStatusExplode: '💥 (Overload 13+!)',
  projectedStatusSafe: '(Safe)',
  handCardsHeader: 'Your Stone Cards ({count})',
  handCardsHintWithTarget:
    'Showing Overload risk for [{carrier}] Carrier (current sum: {sum})',
  handCardsHintNoTarget:
    'Select a chip to preview Overload risk on its Carrier',
  cardTileBlastLabel: 'Overload (13+)!',
  cardTileNormalLabel: 'Stone Card',
  handChipsHeader: 'Your Color Chips ({count})',
  handChipsHint: 'Your stone will stack on the matching Carrier color',
  chipCarrierSumShort: '(Sum:{sum})',
  selectedBadge: 'Selected',
  rainbowTargetPrompt:
    'Rainbow Chip Target — Choose which Carrier to place your stone on:',
  rainbowTargetSub: 'Sum: {sum} / 13 ({count} stones)',
  passTurnBtn: 'Pass (1/Round)',
  submitComboBtnActive: 'Submit Stone [{card}] to [{carrier}] Carrier ({chip})',
  submitComboBtnDisabled: 'Select a Stone Card and a Color Chip to submit',

  // Validation & Error Codes
  err_ALREADY_PLAYING: 'Cannot join a match that is already in progress.',
  err_ROOM_FULL: 'All 7 player slots are already filled by human players.',
  err_TARGET_NOT_FOUND: 'Target player not found.',
  err_NOT_HALF_TIME: 'Not currently in the half-time settlement phase.',
  err_NOT_PLAYING: 'The match is not currently in progress.',
  err_NOT_YOUR_TURN: 'It is not your turn.',
  err_PLAYER_NOT_FOUND: 'Player information not found.',
  err_CANNOT_PASS: 'You have already passed this round or cannot pass now.',
  err_CARD_NOT_OWNED: 'You do not hold that Stone Card.',
  err_CHIP_NOT_OWNED: 'You do not hold that Color Chip.',
  err_RAINBOW_TARGET_REQUIRED:
    'Please select a target Carrier (Red, Green, or Blue) for your Rainbow Chip.',
  err_UNKNOWN_ACTION: 'Unknown game action.',
  err_NO_HOST_SESSION: 'Host session is not active.',
  err_NO_HOST_PERMISSION: 'Host permission required.',
  err_SELECT_BOTH_REQUIRED:
    'Please select both 1 Stone Card and 1 Color Chip to submit.',
  err_P2P_DISCONNECTED: 'P2P data channel to the Host is disconnected.',
  err_SESSION_NOT_INIT: 'Game session is not initialized.',
  err_SENDER_MISMATCH: 'Sender ID verification failed.',
  err_HOST_LOST: 'Connection to the Host was closed.',
  err_HOST_PEER_ERROR: 'Host P2P error: {detail}',
  err_JOIN_FAILED:
    'Failed to join room ({roomCode}): Host not found or network error. ({detail})',

  // Structured Event Logs
  log_LOBBY_CREATED:
    'Lobby created. Empty seats are automatically filled by AI bots.',
  log_GAME_STARTED:
    '1st Half (Rounds 1–7) started! Everyone received 7 Stone Cards (0–6) and 7 Color Chips.',
  log_ROUND_STARTED: 'Round {round} started. First player: {playerName}',
  log_SECOND_HALF_STARTED:
    '2nd Half Round {round} started! First player: {playerName}',
  log_HALF_TIME_REACHED:
    '1st Half (Round 7) finished! Only player hands (7 Stone Cards & 7 Chips) are replenished; stones on the Carriers remain intact.',
  log_PASS_TURN:
    '{playerName} passed their turn. (Will submit in reverse order after regular turns)',
  log_SUBMIT_NORMAL:
    '{playerName} submitted Stone [{card}] to [{carrier}] Carrier. (Sum: {previousSum} → {newSum})',
  log_SUBMIT_RAINBOW:
    '{playerName} used Rainbow Chip to submit Stone [{card}] to [{carrier}] Carrier. (Sum: {previousSum} → {newSum})',
  log_EXPLOSION:
    '💥 [{carrier}] Carrier Overload (13+)! Sum reached {newSum} (>= 13). {playerName} takes +{penaltyAdded} penalty pts and [{carrier}] resets to 0!',
  log_BOT_TAKEOVER:
    '{playerName} disconnected. Local AI bot immediately took over the slot.',
  log_GAME_OVER:
    'Round 14 complete! Bottom 2 players eliminated: {eliminatedList}',
  log_ELIMINATED_ITEM: '{name} ({points} pts)',
};

const ja: TranslationSchema = {
  // Game Title & Common
  gameBadge: '悪魔の計略 〜デビルズ・プラン〜',
  gameTitlePrefix: 'ヘビー',
  gameTitleNumber: '13',
  gameSubtitleLine1:
    '石カード(0〜6)とカラーチップを組み合わせ、台座の合計が13以上にならないよう生き残りましょう。',
  gameSubtitleLine2:
    '空席はローカルAIボットが自動で埋め、常に7人マッチで進行します。',
  soundMuteTooltip: '効果音をミュート',
  soundUnmuteTooltip: '効果音をオンにする',

  // Password Gate
  gateBadge: 'PRIVATE ACCESS GATE',
  gateTitle: 'アクセスパスコード入力',
  gateDesc:
    'このゲームラウンジに入場するには、案内されたパスワードを入力してください。',
  gateInputLabel: 'アクセスパスワード (Passcode)',
  gateInputPlaceholder: 'パスワードを入力してください',
  gateShowPassword: 'パスワードを表示',
  gateHidePassword: 'パスワードを隠す',
  gateSubmitBtn: 'ロック解除して入場',
  gateVerifyingBtn: '確認中...',
  gateErrorInvalid: 'パスワードが一致しません。もう一度ご確認ください。',
  gateInviteDetected:
    '招待ルームコード({roomCode})を検出しました。ロック解除後にそのまま移動します。',

  // Colors & Chips
  color_RED: '赤',
  color_GREEN: '緑',
  color_BLUE: '青',
  color_RAINBOW: 'レインボー',
  chipBadge_RED: '赤チップ',
  chipBadge_GREEN: '緑チップ',
  chipBadge_BLUE: '青チップ',
  chipBadge_RAINBOW: 'レインボーチップ',
  carrierName_RED: '赤 (RED) 台座',
  carrierName_GREEN: '緑 (GREEN) 台座',
  carrierName_BLUE: '青 (BLUE) 台座',

  // Default Names
  defaultHostName: 'ホスト',
  defaultGuestName: 'ゲスト',
  defaultPlayerName: 'プレイヤー {index}',
  botName_1: 'AI アルファ',
  botName_2: 'AI ベータ',
  botName_3: 'AI ガンマ',
  botName_4: 'AI デルタ',
  botName_5: 'AI イプシロン',
  botName_6: 'AI ゼータ',
  botName_7: 'AI イータ',
  botTakeoverSuffix: '{name} (AI)',

  // Lobby - Initial Screen
  nicknameLabel: 'プレイヤー名',
  nicknamePlaceholder: 'ニックネームを入力（未入力時は自動設定）',
  createRoomTitle: 'ルーム作成 (Host)',
  createRoomDesc:
    'ルームを作成して招待コードやリンクで友達を招待するか、AIボットとすぐに対戦を始めます。',
  createRoomBtn: 'ルームを作成する',
  initializingP2P: 'P2P初期化中...',
  joinRoomTitle: 'コードで参加 (Guest)',
  joinRoomPlaceholder: '6桁コード (例: AB12CD)',
  joinRoomBtn: 'ルームに入る',
  connectingP2P: '接続中...',
  rulesSummaryTitle: 'ルール概要（全14ラウンド）',
  rulesSummaryItem1:
    '前半(1〜7R)開始時、全員に石カード0〜6(7枚)と赤・緑・青チップ各2個、レインボー1個を支給',
  rulesSummaryItem2:
    '第7ラウンド終了時は手札（石カード・チップ）のみ再支給され、台座に積まれた石と合計はそのまま維持',
  rulesSummaryItem3:
    '台座の石と合計は、合計が13以上になって爆発（13オーバー！）した時のみ0にリセット',
  rulesSummaryItem4: '全14ラウンド終了後、累積ペナルティ最下位2名が最終脱落',

  // Lobby - Waiting Room
  waitingRoomBadge: '7人マッチ待機室',
  waitingRoomCounts: '人間 {humanCount}名 · AIボット {botCount}名',
  roomCodeLabel: 'ルームコード:',
  copyCodeBtn: 'コードコピー',
  codeCopiedBtn: 'コピー完了',
  copyLinkBtn: '招待リンクをコピー',
  linkCopiedBtn: 'リンクコピー完了',
  slotStatusHeader: 'スロット状況（全7席固定）',
  slotStatusSub:
    '新しいプレイヤーが入室すると、AIボット席が自動的にプレイヤー席に切り替わります',
  meBadge: '自分',
  slotNumberLabel: 'スロット #{index}',
  roleHostLabel: 'ホスト (Host)',
  roleBotLabel: 'ローカルAIボット',
  roleHumanLabel: 'プレイヤー (P2P)',
  statusBotReady: 'AI待機中',
  statusConnected: '接続済み',
  leaveRoomBtn: 'ルームを出る',
  startGameBtn: '7人マッチ開始（全14ラウンド）',
  waitingForHostStart: 'ホストがゲームを開始するのを待っています...',

  // GameBoard - Header & Player Cards
  roundBadge: 'ROUND {round} / {maxRounds}',
  firstHalfLabel: '前半 (1〜7R)',
  secondHalfLabel: '後半 (8〜14R)',
  currentTurnLabel: '現在のターン:',
  leaveBtnShort: '退出',
  penaltyBadge: '罰点 {points}',
  remainingCardsLabel: '残り石カード',
  remainingCardsUnit: '{count}枚',
  remainingChipsLabel: '残りチップ',
  remainingChipsUnit: '{count}個',
  starterBadge: '先手',
  passWaitingBadge: 'パス待機',
  actedDoneBadge: '提出済',
  botThinkingStatus: 'AI思考中...',
  turnActiveStatus: 'ターン進行中',

  // GameBoard - 3-Color Carrier Pillars
  carrierSectionTitle: '3色の台座 (Carrier)',
  carrierSectionDesc:
    '提出された石カードは各台座の上に1段目左→1段目右→2段目左の順に積み上がり、合計が13以上になると13オーバー！となります。',
  lastSubmittedLabel: '直前の提出:',
  lastSubmittedFormat:
    '{playerName} → [{carrier}] 台座に石 [{card}] ({chip})',
  pillarIdleBadge: '待機',
  pillarExplodingStatus: '💥 13オーバー！',
  pillarDangerStatus: '危険 (爆発寸前)',
  pillarWarningStatus: '注意区間',
  pillarStonesCountStatus: '石 {count}個積載',
  stoneTileTooltip: '{playerName} ({chip})',
  rainbowStoneTooltip: 'レインボーチップで配置',
  lastExplosionBanner:
    '直近の爆発({round}R · [{carrier}] 台座): {playerName}さんが合計{finalSum}で罰点+{penalty}点を受け、台座が0にリセットされました。',
  liveLogTitle: 'リアルタイム進行ログ',
  liveLogRecentCount: '最新30件',

  // GameBoard - Modals (Half-time & Game Over)
  halfTimeTitle: '前半(1〜7ラウンド) 中間精算',
  halfTimeDesc:
    '手札（石カード7枚・カラーチップ7個）のみ新しく再支給され、3つの台座に積まれている石と現在の合計はそのまま維持されます。',
  halfTimeScoreHeader: '中間ペナルティ順位',
  penaltyPointsValue: '罰点 {points}点',
  startSecondHalfBtn: '後半 (8〜14ラウンド) を開始する',
  waitingForHostSecondHalf: 'ホストが後半を開始するのを待っています...',
  gameOverBadge: '全14ラウンド終了',
  gameOverTitle: '最終順位・脱落者判定',
  gameOverDesc: '累積ペナルティが最も多い最下位2名が最終脱落となります。',
  eliminatedBadge: '最終脱落',
  backToLobbyBtn: '待機室に戻る（再戦）',

  // PlayerHand
  myTurnPrompt:
    'あなたのターン — 提出する石カード(0〜6)1枚とカラーチップ1個を選択してください',
  otherTurnPrompt: '他プレイヤーのターン進行中（自分の手札プレビュー）',
  projectedSumPreview:
    '[{carrier}] 予想合計: {currentSum} + {card} = {projectedSum} {status}',
  projectedStatusExplode: '💥 (13オーバー！)',
  projectedStatusSafe: '(安全)',
  handCardsHeader: '所持石カード ({count}枚)',
  handCardsHintWithTarget:
    '[{carrier}] 台座(現在 {sum})基準で13オーバー危険を表示中',
  handCardsHintNoTarget:
    'チップを選択すると対象の台座基準で13オーバー危険が表示されます',
  cardTileBlastLabel: '13オーバー！',
  cardTileNormalLabel: '石カード',
  handChipsHeader: '所持カラーチップ ({count}個)',
  handChipsHint: '選択したチップの色の台座に石が積まれます',
  chipCarrierSumShort: '(合計:{sum})',
  selectedBadge: '選択中',
  rainbowTargetPrompt:
    'レインボーチップ対象台座の選択 — どの色の台座に石を載せますか？',
  rainbowTargetSub: '現在合計: {sum} / 13 (石 {count}個)',
  passTurnBtn: 'パス (ラウンド1回)',
  submitComboBtnActive: '[{carrier}] 台座に石 [{card}] ({chip}) を提出',
  submitComboBtnDisabled: '提出する石カードとカラーチップを選択してください',

  // Validation & Error Codes
  err_ALREADY_PLAYING: 'すでに進行中のゲームには途中参加できません。',
  err_ROOM_FULL: '7人スロットがすべて人間プレイヤーで満원です。',
  err_TARGET_NOT_FOUND: '対象プレイヤーが見つかりません。',
  err_NOT_HALF_TIME: '中間精算フェーズではありません。',
  err_NOT_PLAYING: '現在ゲーム進行中ではありません。',
  err_NOT_YOUR_TURN: 'あなたのターンではありません。',
  err_PLAYER_NOT_FOUND: 'プレイヤー情報が存在しません。',
  err_CANNOT_PASS: 'このラウンドではすでにパスを使用したか、パスできません。',
  err_CARD_NOT_OWNED: '所持していない石カードです。',
  err_CHIP_NOT_OWNED: '所持していないカラーチップです。',
  err_RAINBOW_TARGET_REQUIRED:
    'レインボーチップ使用時は石を載せる対象の台座（赤・緑・青）を選択してください。',
  err_UNKNOWN_ACTION: '不明なアクションです。',
  err_NO_HOST_SESSION: 'ホストセッションが有効ではありません。',
  err_NO_HOST_PERMISSION: 'ホスト権限がありません。',
  err_SELECT_BOTH_REQUIRED:
    '提出する石カード1枚とカラーチップ1個を両方選択してください。',
  err_P2P_DISCONNECTED: 'ホストとのP2Pデータチャネルが接続されていません。',
  err_SESSION_NOT_INIT: 'セッションが初期化されていません。',
  err_SENDER_MISMATCH: '送信者IDの検証に失敗しました。',
  err_HOST_LOST: 'ホストとの接続が終了しました。',
  err_HOST_PEER_ERROR: 'ホストP2Pエラー: {detail}',
  err_JOIN_FAILED:
    'ルーム接続失敗 ({roomCode}): ホストが見つからないかネットワークエラーが発生しました。({detail})',

  // Structured Event Logs
  log_LOBBY_CREATED:
    'ロビーが作成されました。空席は自動的にAIボットが埋めます。',
  log_GAME_STARTED:
    '前半(1〜7ラウンド)が開始されました！全員に石カード7枚(0〜6)とカラーチップ7個が支給されました。',
  log_ROUND_STARTED:
    '第{round}ラウンドが開始されました。先手プレイヤー: {playerName}',
  log_SECOND_HALF_STARTED:
    '後半・第{round}ラウンドが開始されました！先手プレイヤー: {playerName}',
  log_HALF_TIME_REACHED:
    '前半(第7ラウンド)が終了しました！手札(石カード7枚・チップ7個)のみ再支給され、台座に積まれた石と合計はそのまま維持されます。',
  log_PASS_TURN:
    '{playerName}さんがパスしました。（通常ターン終了後に逆順で提出します）',
  log_SUBMIT_NORMAL:
    '{playerName}さんが [{carrier}] 台座に石 [{card}] を提出しました。(合計: {previousSum} → {newSum})',
  log_SUBMIT_RAINBOW:
    '{playerName}さんがレインボーチップで [{carrier}] 台座に石 [{card}] を提出しました。(合計: {previousSum} → {newSum})',
  log_EXPLOSION:
    '💥 [{carrier}] 台座 13オーバー！合計が{newSum}(>= 13)に達し、{playerName}さんが罰点+{penaltyAdded}点を受け、[{carrier}] 台座が0にリセットされました！',
  log_BOT_TAKEOVER:
    '{playerName}さんの接続が切断され、ローカルAIボットが即座にスロットを引き継ぎました。',
  log_GAME_OVER:
    '全14ラウンド終了！累積ペナルティ最下位2名が脱落: {eliminatedList}',
  log_ELIMINATED_ITEM: '{name}(罰点 {points}点)',
};

export const translations: Record<Language, TranslationSchema> = {
  ko,
  en,
  ja,
};

/**
 * 초기 접속 시 localStorage 설정 우선 적용, 없으면 navigator.language 감지
 * ('ja'로 시작하면 'ja', 'ko'로 시작하면 'ko', 그 외 'en')
 */
export function detectInitialLanguage(): Language {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'ko' || saved === 'en' || saved === 'ja') {
        return saved;
      }
    } catch {
      // localStorage 접근 차단 시 무시
    }

    if (typeof navigator !== 'undefined' && navigator.language) {
      const lower = navigator.language.toLowerCase();
      if (lower.startsWith('ja')) return 'ja';
      if (lower.startsWith('ko')) return 'ko';
      return 'en';
    }
  }
  return 'ko';
}

/**
 * 동적 변수 치환(예: {playerName}, {round})을 처리하는 타입 안전 번역 헬퍼
 */
export function translate(
  lang: Language,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const dict = translations[lang] ?? translations.ko;
  const template = dict[key] ?? translations.ko[key] ?? String(key);

  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const val = params[token];
    return val !== undefined ? String(val) : `{${token}}`;
  });
}

/**
 * 칩/받침대 색상 코드를 현재 언어로 변환
 */
export function formatColorName(
  lang: Language,
  color: ChipColor | CarrierColor
): string {
  switch (color) {
    case 'RED':
      return translate(lang, 'color_RED');
    case 'GREEN':
      return translate(lang, 'color_GREEN');
    case 'BLUE':
      return translate(lang, 'color_BLUE');
    case 'RAINBOW':
      return translate(lang, 'color_RAINBOW');
  }
}

export function formatChipBadge(lang: Language, color: ChipColor): string {
  switch (color) {
    case 'RED':
      return translate(lang, 'chipBadge_RED');
    case 'GREEN':
      return translate(lang, 'chipBadge_GREEN');
    case 'BLUE':
      return translate(lang, 'chipBadge_BLUE');
    case 'RAINBOW':
      return translate(lang, 'chipBadge_RAINBOW');
  }
}

/**
 * AI 봇 기본 식별자('bot-1' ~ 'bot-6') 또는 로컬라이즈 가능한 플레이어 이름을 현재 언어로 변환
 */
export function formatPlayerDisplayName(
  lang: Language,
  player: { id: string; name: string; isBot?: boolean }
): string {
  const botMatch = /^bot-(\d+)$/.exec(player.id);
  if (botMatch) {
    const idx = Number(botMatch[1]);
    const botKey = `botName_${idx}` as TranslationKey;
    if (botKey in translations[lang]) {
      return translate(lang, botKey);
    }
  }
  return player.name;
}

/**
 * 에러 코드 문자열('err_NOT_YOUR_TURN', 'err_JOIN_FAILED:CODE:type' 등)을 현재 언어로 변환
 */
export function formatErrorMessage(
  lang: Language,
  rawError: string | null
): string | null {
  if (!rawError) return null;

  if (rawError.startsWith('err_JOIN_FAILED:')) {
    const parts = rawError.split(':');
    return translate(lang, 'err_JOIN_FAILED', {
      roomCode: parts[1] ?? '',
      detail: parts.slice(2).join(':') || 'error',
    });
  }

  if (rawError.startsWith('err_HOST_PEER_ERROR:')) {
    const detail = rawError.slice('err_HOST_PEER_ERROR:'.length);
    return translate(lang, 'err_HOST_PEER_ERROR', { detail });
  }

  const maybeKey = rawError as TranslationKey;
  if (maybeKey in translations[lang]) {
    return translate(lang, maybeKey);
  }

  return rawError;
}

/**
 * 구조화된 GameLogEntry를 각 클라이언트(Host/Guest)의 선택 언어로 포맷팅
 */
export function formatGameLogEntry(lang: Language, log: GameLogEntry): string {
  if (!log.eventKey) {
    return log.message ?? '';
  }

  const p = log.params ?? {};
  const resolvedPlayerName = p.playerId
    ? formatPlayerDisplayName(lang, {
        id: p.playerId,
        name: p.playerName ?? '',
      })
    : p.playerName ?? '';

  const resolvedCarrier = p.targetCarrier
    ? formatColorName(lang, p.targetCarrier)
    : '';

  switch (log.eventKey) {
    case 'LOBBY_CREATED':
      return translate(lang, 'log_LOBBY_CREATED');

    case 'GAME_STARTED':
      return translate(lang, 'log_GAME_STARTED');

    case 'ROUND_STARTED':
      return translate(lang, 'log_ROUND_STARTED', {
        round: log.round,
        playerName: resolvedPlayerName,
      });

    case 'SECOND_HALF_STARTED':
      return translate(lang, 'log_SECOND_HALF_STARTED', {
        round: log.round,
        playerName: resolvedPlayerName,
      });

    case 'HALF_TIME_REACHED':
      return translate(lang, 'log_HALF_TIME_REACHED');

    case 'PASS_TURN':
      return translate(lang, 'log_PASS_TURN', {
        playerName: resolvedPlayerName,
      });

    case 'SUBMIT_NORMAL':
      return translate(lang, 'log_SUBMIT_NORMAL', {
        playerName: resolvedPlayerName,
        carrier: resolvedCarrier,
        card: p.card ?? 0,
        previousSum: p.previousSum ?? 0,
        newSum: p.newSum ?? 0,
      });

    case 'SUBMIT_RAINBOW':
      return translate(lang, 'log_SUBMIT_RAINBOW', {
        playerName: resolvedPlayerName,
        carrier: resolvedCarrier,
        card: p.card ?? 0,
        previousSum: p.previousSum ?? 0,
        newSum: p.newSum ?? 0,
      });

    case 'EXPLOSION':
      return translate(lang, 'log_EXPLOSION', {
        carrier: resolvedCarrier,
        newSum: p.newSum ?? 13,
        playerName: resolvedPlayerName,
        penaltyAdded: p.penaltyAdded ?? 1,
      });

    case 'BOT_TAKEOVER':
      return translate(lang, 'log_BOT_TAKEOVER', {
        playerName: resolvedPlayerName,
      });

    case 'GAME_OVER': {
      const list = (p.eliminatedPlayers ?? [])
        .map((item) =>
          translate(lang, 'log_ELIMINATED_ITEM', {
            name: formatPlayerDisplayName(lang, {
              id: item.id,
              name: item.name,
            }),
            points: item.penaltyPoints,
          })
        )
        .join(', ');
      return translate(lang, 'log_GAME_OVER', { eliminatedList: list });
    }

    default:
      return log.message ?? '';
  }
}
