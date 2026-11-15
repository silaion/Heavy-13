// src/i18n/translations.ts
import type { CarrierColor, ChipColor, GameLogEntry, RoundPhase } from '../types/game';

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
  gateInviteDetected:
    '초대 방 코드({roomCode})가 감지되었습니다. 잠금 해제 후 즉시 연결됩니다.',

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
  rulesSummaryTitle: '게임 규칙 요약 (총 14라운드 · 원작 룰)',
  rulesSummaryItem1:
    '매 라운드 7명 전원 동시에 색깔 칩 1개 + 바위 카드(0~6) 1장을 비밀리에 제출합니다.',
  rulesSummaryItem2:
    '칩 공개 → 카드 공개 후 [레인보우 칩 > 높은 숫자 > 선 플레이어 시계방향] 순으로 배치하며, 차례에 라운드당 1회 패스(역순 후배치)가 가능합니다.',
  rulesSummaryItem3:
    '받침대 합계가 13 이상이 되면 직전까지 놓여 있던 기존 큐브들을 모두 수거해 그 개수만큼 벌점을 받고, 방금 놓은 새 큐브 1개만 남습니다.',
  rulesSummaryItem4:
    '7라운드 종료 시 손패(카드·칩)만 재지급되며 받침대 위 돌은 유지됩니다. 14라운드 종료 후 누적 벌점 최하위 2명 탈락!',

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

  // Round Phases & Placement Queue
  phase_SELECTION: '동시 선택 단계',
  phase_REVEAL_CHIPS: '1차 공개: 색깔 칩 공개',
  phase_REVEAL_CARDS: '2차 공개: 바위 카드 & 배치 순서 확정',
  phase_PLACEMENT_REGULAR: '큐브 배치 진행 중',
  phase_PLACEMENT_PASSED: '패스 역순(LIFO) 배치 중',
  phase_ROUND_END: '라운드 정산 중',
  phaseDesc_SELECTION:
    '7명 전원이 동시에 칩 1개와 바위 카드 1장을 비밀리에 선택합니다 ({submittedCount} / 7 완료)',
  phaseDesc_REVEAL_CHIPS:
    '모든 플레이어가 제출한 색깔 칩이 먼저 공개되었습니다! 곧 바위 카드 숫자가 공개됩니다...',
  phaseDesc_REVEAL_CARDS:
    '바위 카드가 공개되었습니다! [레인보우 칩 → 높은 숫자 → 선 플레이어 시계방향] 순으로 배치 순서가 확정되었습니다.',
  phaseDesc_PLACEMENT_REGULAR:
    '확정된 우선순위에 따라 차례대로 받침대에 큐브를 배치하거나 패스(1회)를 선언합니다.',
  phaseDesc_PLACEMENT_PASSED:
    '일반 배치가 끝나고, 패스를 선언한 플레이어들이 역순(가장 마지막에 패스한 순서)으로 큐브를 배치합니다.',
  firstPlayerLabel: '선 플레이어:',
  placementQueueTitle: '이번 라운드 배치 순서 큐 (Placement Queue)',
  placementQueueHint:
    '우선순위: 레인보우 칩 > 높은 숫자(6→0) > 선 플레이어 시계방향',
  queueStatusPending: '대기',
  queueStatusActive: '배치 차례',
  queueStatusPassed: '패스 (역순 대기)',
  queueStatusPlaced: '배치 완료',
  hiddenCardLabel: '?',
  selectionDoneBadge: '선택 완료',
  selectionSelectingBadge: '선택 중...',

  // GameBoard - Header & Player Cards
  roundBadge: 'ROUND {round} / {maxRounds}',
  firstHalfLabel: '전반부 (1~7R)',
  secondHalfLabel: '후반부 (8~14R)',
  currentTurnLabel: '현재 배치 차례:',
  leaveBtnShort: '나가기',
  penaltyBadge: '벌점 {points}',
  remainingCardsLabel: '남은 카드',
  remainingCardsUnit: '{count}장',
  remainingChipsLabel: '남은 칩',
  remainingChipsUnit: '{count}개',
  starterBadge: '선(先)',
  passWaitingBadge: '패스 (역순 대기)',
  actedDoneBadge: '배치 완료',
  botThinkingStatus: 'AI 결정 중...',
  turnActiveStatus: '배치 차례',

  // GameBoard - 3-Color Carrier Pillars
  carrierSectionTitle: '3색 짐꾼 받침대 (받침대)',
  carrierSectionDesc:
    '제출된 바위 큐브는 각 받침대 위 1층 왼쪽 → 1층 오른쪽 → 2층 왼쪽 순서로 쌓이며, 합계가 13 이상이 되면 직전 큐브들을 수거(개수만큼 벌점)하고 새 큐브 1개만 남습니다.',
  lastSubmittedLabel: '직전 배치:',
  lastSubmittedFormat: '{playerName} → [{carrier}] 받침대에 돌 [{card}] ({chip})',
  pillarIdleBadge: '대기',
  pillarExplodingStatus: '💥 13 폭발!',
  pillarDangerStatus: '위험 (폭발 임박)',
  pillarWarningStatus: '주의 구간',
  pillarStonesCountStatus: '돌 {count}개 적재',
  stoneTileTooltip: '{playerName} ({chip})',
  rainbowStoneTooltip: '레인보우 칩으로 배치됨',
  lastExplosionBanner:
    '최근 폭발({round}R · [{carrier}] 받침대): {playerName}님이 합계 {finalSum} 도달로 기존 돌 {collectedCount}개를 수거(벌점 +{penalty}점)하고 새 돌 [{newBaseSum}]만 남았습니다.',
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

  // PlayerHand - Selection & Placement Modes
  selectionPromptPending:
    '동시 선택 단계 — 이번 라운드에 제출할 바위 카드(0~6) 1장과 색깔 칩 1개를 비밀리에 선택하세요',
  selectionPromptLocked:
    '제출 완료! 다른 플레이어들의 선택이 끝날 때까지 잠시 기다려 주세요 ({submittedCount} / 7 완료)',
  revealWaitPrompt:
    '제출된 칩과 바위 카드를 공개하고 이번 라운드 배치 순서를 정렬하고 있습니다...',
  placementMyTurnPrompt:
    '나의 큐브 배치 차례! — 지금 받침대에 배치하거나 패스(뒤로 미루기)를 선택하세요',
  placementOtherTurnPrompt:
    '{playerName}님의 큐브 배치 차례가 진행 중입니다',
  myLockedSubmissionLabel: '이번 라운드 내 제출 조합:',
  projectedSumPreview:
    '[{carrier}] 배치 시 합계: {currentSum} + {card} = {projectedSum} {status}',
  projectedStatusExplode: '💥 (13 폭발! 기존 돌 {collectedCount}개 수거 · 벌점 +{collectedCount}점)',
  projectedStatusSafe: '(안전)',
  handCardsHeader: '보유 바위 카드 ({count}장)',
  handCardsHintWithTarget:
    '[{carrier}] 받침대(현재 합 {sum}, 돌 {stonesCount}개) 기준 13 폭발 여부 표시 중',
  handCardsHintNoTarget: '칩을 선택하면 해당 받침대 기준 폭발 여부가 표시됩니다',
  cardTileBlastLabel: '13 폭발!',
  cardTileNormalLabel: '바위 카드',
  handChipsHeader: '보유 색깔 칩 ({count}개)',
  handChipsHint: '레인보우 칩은 배치 우선순위 1순위를 가지며 배치 시 원하는 받침대를 고를 수 있습니다',
  chipCarrierSumShort: '(합:{sum})',
  selectedBadge: '선택됨',
  rainbowTargetPrompt:
    '레인보우 칩 대상 받침대 선택 — 어느 색깔 받침대에 큐브를 배치하시겠습니까?',
  rainbowTargetSub: '현재 합: {sum} / 13 (기존 돌 {count}개)',
  lockInSelectionBtnActive: '바위 [{card}] + [{chip}] 비밀 제출 완료하기',
  lockInSelectionBtnDisabled: '제출할 바위 카드 1장과 색깔 칩 1개를 선택하세요',
  lockInDoneBtn: '이번 라운드 선택 제출 완료 (대기 중)',
  passTurnBtn: '패스하기 (뒤로 미루기 · 1회)',
  placeNowBtnActive: '[{carrier}] 받침대에 돌 [{card}] 바로 배치하기',
  placeNowBtnSelectTarget: '배치할 대상 받침대(빨강·초록·파랑)를 선택하세요',

  // Validation & Error Codes
  err_ALREADY_PLAYING: '이미 진행 중인 게임에는 신규 입장할 수 없습니다.',
  err_ROOM_FULL: '7인 슬롯이 모두 인간 플레이어로 가득 찼습니다.',
  err_TARGET_NOT_FOUND: '대상 플레이어를 찾을 수 없습니다.',
  err_NOT_HALF_TIME: '중간 정산 단계가 아닙니다.',
  err_NOT_PLAYING: '현재 게임 진행 중이 아닙니다.',
  err_NOT_SELECTION_PHASE: '현재 동시 선택 단계가 아닙니다.',
  err_ALREADY_SUBMITTED: '이번 라운드에는 이미 선택을 제출했습니다.',
  err_NOT_YOUR_TURN: '본인의 배치 차례가 아닙니다.',
  err_PLAYER_NOT_FOUND: '플레이어 정보가 존재하지 않습니다.',
  err_CANNOT_PASS:
    '이번 라운드에서는 이미 패스를 사용했거나 패스할 수 없는 상태입니다.',
  err_CARD_NOT_OWNED: '보유하지 않은 바위 카드입니다.',
  err_CHIP_NOT_OWNED: '보유하지 않은 색깔 칩입니다.',
  err_RAINBOW_TARGET_REQUIRED:
    '레인보우 칩 배치 시 돌을 올릴 대상 받침대(빨강·초록·파랑)를 선택해야 합니다.',
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
    '전반부(1~7라운드)가 시작되었습니다! 전원 동시에 색깔 칩 1개와 바위 카드 1장을 선택해 주세요.',
  log_ROUND_STARTED:
    '제 {round}라운드 동시 선택이 시작되었습니다. (현재 선 플레이어: {playerName})',
  log_SECOND_HALF_STARTED:
    '후반부 제 {round}라운드가 시작되었습니다! (선 플레이어: {playerName})',
  log_HALF_TIME_REACHED:
    '전반부(7라운드)가 종료되었습니다! 손패(바위 카드 7장·칩 7개)만 전량 재지급되며, 받침대에 쌓인 돌과 합계는 그대로 유지됩니다.',
  log_CHIPS_REVEALED:
    '7명 전원이 선택을 마쳐 제출한 색깔 칩이 일제히 공개되었습니다!',
  log_CARDS_REVEALED:
    '바위 카드가 모두 공개되어 우선순위에 따라 이번 라운드 배치 순서가 확정되었습니다.',
  log_PASS_TURN:
    '{playerName}님이 큐브 배치를 패스했습니다! (일반 배치 종료 후 역순으로 배치합니다)',
  log_SUBMIT_NORMAL:
    '{playerName}님이 [{carrier}] 받침대에 바위 [{card}]을(를) 배치했습니다. (합계: {previousSum} → {newSum})',
  log_SUBMIT_RAINBOW:
    '{playerName}님이 레인보우 칩으로 [{carrier}] 받침대에 바위 [{card}]을(를) 배치했습니다. (합계: {previousSum} → {newSum})',
  log_EXPLOSION:
    '💥 [{carrier}] 받침대 13 폭발! 합계가 {newSum}(>= 13)에 도달하여 직전 돌 {collectedCount}개가 수거되고 {playerName}님이 벌점 +{penaltyAdded}점을 받았습니다! (새 돌 [{newBaseSum}]만 받침대에 잔류)',
  log_STARTER_UPDATED:
    '이번 라운드 마지막 벌점 획득자인 {playerName}님이 다음 라운드 선 플레이어가 됩니다.',
  log_BOT_TAKEOVER:
    '{playerName}님의 연결이 끊어져 로컬 AI 봇이 즉시 슬롯을 인계받았습니다.',
  log_GAME_OVER:
    '14라운드 최종 종료! 누적 벌점 최하위 2명 탈락: {eliminatedList}',
  log_ELIMINATED_ITEM: '{name}(벌점 {points}점)',

  // Rulebook Modal (RuleModal.tsx)
  ruleBtnLabel: '게임 규칙',
  ruleBtnTooltip: '게임 규칙 보기 (?)',
  ruleModalBadge: 'OFFICIAL RULEBOOK',
  ruleModalTitle: '무거운 13 — 게임 규칙 가이드',
  ruleModalSubtitle:
    '동시 선택 · 순차 공개 · 역순 패스(LIFO) · 13 폭발 수거 정산',
  ruleModalCloseBtn: '규칙 닫기',
  ruleTabAll: '전체 요약',
  ruleTabFlow: '배치·패스',
  ruleTabOverload: '13 폭발·벌점',

  ruleSec1Title: '1. 게임 개요 및 승리 조건',
  ruleSec1PlayersLabel: '인원 및 라운드',
  ruleSec1PlayersDesc:
    '7명(인간 플레이어 + 부족한 인원 AI 봇)이 전반부(1~7R)와 후반부(8~14R), 총 14라운드를 진행합니다.',
  ruleSec1ResourcesLabel: '초기 지급 자원',
  ruleSec1ResourcesDesc:
    '각자 바위 카드 7장(0~6)과 색깔 칩 7개(RED x2, GREEN x2, BLUE x2, RAINBOW x1)를 보유하고 시작합니다.',
  ruleSec1WinLabel: '승패 결정',
  ruleSec1WinDesc:
    '14라운드 종료 후 누적 벌점이 가장 높은 최하위 2명이 탈락하고, 나머지 5명이 생존합니다.',

  ruleSec2Title: '2. 매 라운드 진행 순서',
  ruleSec2Step1Label: '1단계 [동시 선택]',
  ruleSec2Step1Desc:
    '7명 전원이 동시에 자신의 손패에서 색깔 칩 1개와 바위 카드 1장을 비밀리에 선택하여 제출합니다.',
  ruleSec2Step2Label: '2단계 [순차 공개]',
  ruleSec2Step2Desc:
    '전원 제출 완료 후 색깔 칩이 먼저 일제히 공개되고, 이어서 바위 카드 숫자가 공개됩니다.',
  ruleSec2Step3Label: '3단계 [배치 우선순위 결정]',
  ruleSec2Step3Priority1:
    '1순위: RAINBOW 칩을 낸 플레이어가 최우선으로 배치합니다.',
  ruleSec2Step3Priority2:
    '2순위: 바위 카드 숫자가 높은 순서(6 → 5 → ... → 0)대로 배치합니다.',
  ruleSec2Step3Priority3:
    '3순위: 위 조건이 같으면 현재 선 플레이어(👑) 기준 시계 방향으로 순서를 결정합니다.',
  ruleSec2StarterTip:
    '※ 해당 라운드에서 가장 마지막으로 벌점을 받은 플레이어가 다음 라운드의 선 플레이어(👑)가 됩니다. (벌점을 받은 플레이어가 없으면 기존 선 플레이어가 유지됩니다.)',

  ruleSec3Title: '3. 큐브 배치 · 패스(Pass) · 13 폭발 정산',
  ruleSec3PlaceLabel: '큐브 배치',
  ruleSec3PlaceDesc:
    '자신의 차례에 제출한 칩 색상(RED, GREEN, BLUE) 받침대에 바위 큐브를 올립니다. RAINBOW 칩은 원하는 색 받침대를 자유롭게 선택합니다.',
  ruleSec3PassLabel: '패스 규칙 (라운드당 1회 · 역순 후배치)',
  ruleSec3PassDesc:
    '자신의 1차 배치 차례에 라운드당 1회 패스할 수 있습니다. 패스한 플레이어들은 일반 배치가 모두 끝난 뒤, 패스를 선언한 순서의 역순(LIFO: 마지막에 패스한 사람부터)으로 큐브를 배치합니다. (패스 후 돌아온 역순 배치 차례에는 재패스가 불가능하며 반드시 배치해야 합니다.)',
  ruleSec3OverloadLabel: '13 이상 폭발 및 벌점 (핵심)',
  ruleSec3OverloadDesc:
    '큐브를 올려 특정 받침대 합계가 13 이상이 되면, 방금 올린 큐브를 제외한 기존 큐브들이 모두 수거되며 그 수거된 기존 큐브 개수만큼 벌점을 획득합니다. 방금 올린 신규 큐브 1개만 해당 받침대에 남고, 받침대 합계는 그 큐브의 숫자 값으로 갱신됩니다.',
  ruleSec3OverloadExample:
    '예시: 기존 큐브 3개(합 11)가 쌓인 받침대에 [4]를 올리면 합계 15(≥13) 폭발! 기존 큐브 3개가 수거되어 벌점 +3점을 받고, 받침대에는 방금 올린 [4](합 4)만 남습니다.',

  ruleSec4Title: '4. 중간 정산 (7라운드 종료 후)',
  ruleSec4HandLabel: '손패 새로 재지급',
  ruleSec4HandDesc:
    '7라운드가 끝나면 모든 플레이어의 손패(바위 카드 7장, 색깔 칩 7개)만 새로 전량 재지급됩니다.',
  ruleSec4CarrierLabel: '받침대 돌·합계 유지',
  ruleSec4CarrierDesc:
    '3개 받침대(RED, GREEN, BLUE) 위에 이미 쌓여 있는 돌과 합계는 초기화되지 않고 8라운드로 그대로 유지됩니다.',
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
  rulesSummaryTitle: 'Game Rules Summary (14 Rounds · Authentic Rules)',
  rulesSummaryItem1:
    'Each round, all 7 players simultaneously lock in 1 Color Chip and 1 Stone Card (0–6) in secret.',
  rulesSummaryItem2:
    'Chips reveal first, then Cards. Placement priority: [Rainbow Chip > Higher Number > Clockwise from First Player]. Each player may Pass once per round (resolved in reverse LIFO order).',
  rulesSummaryItem3:
    'If a Carrier reaches 13+, all previously stacked stones on it are collected as penalty points (1 pt per stone), and only the newly placed stone remains.',
  rulesSummaryItem4:
    'After R7, only hands are replenished while Carrier stones stay intact. After R14, the bottom 2 players with the most penalty points are eliminated!',

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

  // Round Phases & Placement Queue
  phase_SELECTION: 'Simultaneous Selection',
  phase_REVEAL_CHIPS: 'Step 1: Reveal Color Chips',
  phase_REVEAL_CARDS: 'Step 2: Reveal Stone Cards & Order',
  phase_PLACEMENT_REGULAR: 'Cube Placement in Progress',
  phase_PLACEMENT_PASSED: 'Reverse Pass (LIFO) Placement',
  phase_ROUND_END: 'Round Settlement',
  phaseDesc_SELECTION:
    'All 7 players secretly lock in 1 Color Chip and 1 Stone Card ({submittedCount} / 7 locked in)',
  phaseDesc_REVEAL_CHIPS:
    'All submitted Color Chips are revealed! Stone Card numbers will be revealed next...',
  phaseDesc_REVEAL_CARDS:
    'Stone Cards revealed! Placement order set by [Rainbow > High Number > Clockwise from First Player].',
  phaseDesc_PLACEMENT_REGULAR:
    'Players place their stone cube in priority order or declare a Pass (once per round).',
  phaseDesc_PLACEMENT_PASSED:
    'Regular placement finished! Passed players now place their stones in reverse order (LIFO).',
  firstPlayerLabel: 'First Player:',
  placementQueueTitle: 'Round Placement Order Queue',
  placementQueueHint:
    'Priority: Rainbow Chip > High Card (6→0) > Clockwise from First Player',
  queueStatusPending: 'Waiting',
  queueStatusActive: 'Active Turn',
  queueStatusPassed: 'Passed (LIFO)',
  queueStatusPlaced: 'Placed',
  hiddenCardLabel: '?',
  selectionDoneBadge: 'Locked In',
  selectionSelectingBadge: 'Selecting...',

  // GameBoard - Header & Player Cards
  roundBadge: 'ROUND {round} / {maxRounds}',
  firstHalfLabel: '1st Half (R1–7)',
  secondHalfLabel: '2nd Half (R8–14)',
  currentTurnLabel: 'Active Placement:',
  leaveBtnShort: 'Leave',
  penaltyBadge: 'Penalty {points}',
  remainingCardsLabel: 'Stone Cards',
  remainingCardsUnit: '{count}',
  remainingChipsLabel: 'Chips',
  remainingChipsUnit: '{count}',
  starterBadge: '1st',
  passWaitingBadge: 'Passed (LIFO)',
  actedDoneBadge: 'Placed',
  botThinkingStatus: 'AI Deciding...',
  turnActiveStatus: 'Placing',

  // GameBoard - 3-Color Carrier Pillars
  carrierSectionTitle: '3-Color Carriers',
  carrierSectionDesc:
    'Stones stack 2-wide (Row 1 Left → Right → Row 2 Left). Reaching 13+ triggers Overload: previous stones are collected as penalty points, leaving only the new stone!',
  lastSubmittedLabel: 'Last Placed:',
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
    'Last Overload (R{round} · [{carrier}] Carrier): {playerName} hit {finalSum}, collected {collectedCount} previous stones (+{penalty} penalty pts), leaving new stone [{newBaseSum}].',
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

  // PlayerHand - Selection & Placement Modes
  selectionPromptPending:
    'Simultaneous Selection — Secretly select 1 Stone Card (0–6) and 1 Color Chip to lock in',
  selectionPromptLocked:
    'Selection Locked In! Waiting for other players to finish ({submittedCount} / 7 ready)',
  revealWaitPrompt:
    'Revealing submitted Chips & Stone Cards and sorting the placement queue...',
  placementMyTurnPrompt:
    'Your Placement Turn! — Place your stone cube now or Pass (defer to reverse order)',
  placementOtherTurnPrompt:
    "{playerName}'s placement turn is in progress",
  myLockedSubmissionLabel: 'Your Locked-in Combo:',
  projectedSumPreview:
    '[{carrier}] Projected: {currentSum} + {card} = {projectedSum} {status}',
  projectedStatusExplode:
    '💥 (Overload 13+! Collects {collectedCount} stones · +{collectedCount} penalty pts)',
  projectedStatusSafe: '(Safe)',
  handCardsHeader: 'Your Stone Cards ({count})',
  handCardsHintWithTarget:
    'Showing Overload risk for [{carrier}] Carrier (sum: {sum}, {stonesCount} stones)',
  handCardsHintNoTarget:
    'Select a chip to preview Overload risk on its Carrier',
  cardTileBlastLabel: 'Overload (13+)!',
  cardTileNormalLabel: 'Stone Card',
  handChipsHeader: 'Your Color Chips ({count})',
  handChipsHint:
    'Rainbow Chip grants #1 placement priority and lets you pick any Carrier during placement',
  chipCarrierSumShort: '(Sum:{sum})',
  selectedBadge: 'Selected',
  rainbowTargetPrompt:
    'Rainbow Chip Target — Choose which Carrier to place your stone cube on:',
  rainbowTargetSub: 'Current Sum: {sum} / 13 ({count} existing stones)',
  lockInSelectionBtnActive: 'Lock In Stone [{card}] + [{chip}] in Secret',
  lockInSelectionBtnDisabled: 'Select 1 Stone Card and 1 Color Chip to lock in',
  lockInDoneBtn: 'Selection Locked In (Waiting for others)',
  passTurnBtn: 'Pass (Defer in Reverse Order · 1/Round)',
  placeNowBtnActive: 'Place Stone [{card}] on [{carrier}] Carrier Now',
  placeNowBtnSelectTarget: 'Select a target Carrier (Red, Green, or Blue)',

  // Validation & Error Codes
  err_ALREADY_PLAYING: 'Cannot join a match that is already in progress.',
  err_ROOM_FULL: 'All 7 player slots are already filled by human players.',
  err_TARGET_NOT_FOUND: 'Target player not found.',
  err_NOT_HALF_TIME: 'Not currently in the half-time settlement phase.',
  err_NOT_PLAYING: 'The match is not currently in progress.',
  err_NOT_SELECTION_PHASE: 'Not currently in the selection phase.',
  err_ALREADY_SUBMITTED: 'You have already locked in your selection this round.',
  err_NOT_YOUR_TURN: 'It is not your placement turn.',
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
    'Please select both 1 Stone Card and 1 Color Chip to lock in.',
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
    '1st Half (Rounds 1–7) started! All players simultaneously lock in 1 Chip and 1 Stone Card.',
  log_ROUND_STARTED:
    'Round {round} simultaneous selection started! (First Player: {playerName})',
  log_SECOND_HALF_STARTED:
    '2nd Half Round {round} started! (First Player: {playerName})',
  log_HALF_TIME_REACHED:
    '1st Half (Round 7) finished! Only player hands (7 Stone Cards & 7 Chips) are replenished; stones on the Carriers remain intact.',
  log_CHIPS_REVEALED:
    'All 7 players locked in! Submitted Color Chips have been revealed.',
  log_CARDS_REVEALED:
    'All Stone Cards revealed! Placement priority order has been locked.',
  log_PASS_TURN:
    '{playerName} passed their placement! (Will place in reverse LIFO order after regular turns)',
  log_SUBMIT_NORMAL:
    '{playerName} placed Stone [{card}] on [{carrier}] Carrier. (Sum: {previousSum} → {newSum})',
  log_SUBMIT_RAINBOW:
    '{playerName} used Rainbow Chip to place Stone [{card}] on [{carrier}] Carrier. (Sum: {previousSum} → {newSum})',
  log_EXPLOSION:
    '💥 [{carrier}] Carrier Overload (13+)! Sum reached {newSum}. {collectedCount} previous stones collected (+{penaltyAdded} penalty pts to {playerName}), leaving new stone [{newBaseSum}]!',
  log_STARTER_UPDATED:
    '{playerName} (last to take penalty points this round) becomes the First Player for the next round.',
  log_BOT_TAKEOVER:
    '{playerName} disconnected. Local AI bot immediately took over the slot.',
  log_GAME_OVER:
    'Round 14 complete! Bottom 2 players eliminated: {eliminatedList}',
  log_ELIMINATED_ITEM: '{name} ({points} pts)',

  // Rulebook Modal (RuleModal.tsx)
  ruleBtnLabel: 'Rules',
  ruleBtnTooltip: 'View Game Rules (?)',
  ruleModalBadge: 'OFFICIAL RULEBOOK',
  ruleModalTitle: 'Heavy 13 — Game Rules Guide',
  ruleModalSubtitle:
    'Simultaneous Lock-In · Step Reveal · Reverse Pass (LIFO) · 13+ Stone Collection',
  ruleModalCloseBtn: 'Close Rules',
  ruleTabAll: 'All Summary',
  ruleTabFlow: 'Placement & Pass',
  ruleTabOverload: '13+ Overload',

  ruleSec1Title: '1. Overview & Winning Condition',
  ruleSec1PlayersLabel: 'Players & Rounds',
  ruleSec1PlayersDesc:
    '7 players (human players + AI bots filling empty seats) compete across 14 rounds: 1st Half (1–7R) and 2nd Half (8–14R).',
  ruleSec1ResourcesLabel: 'Starting Hand',
  ruleSec1ResourcesDesc:
    'Everyone starts with 7 Stone Cards (0–6) and 7 Color Chips (RED x2, GREEN x2, BLUE x2, RAINBOW x1).',
  ruleSec1WinLabel: 'Survival & Elimination',
  ruleSec1WinDesc:
    'After Round 14, the bottom 2 players with the most cumulative penalty points are eliminated; the other 5 survive.',

  ruleSec2Title: '2. Round Flow (Step-by-Step)',
  ruleSec2Step1Label: 'Step 1 [Simultaneous Selection]',
  ruleSec2Step1Desc:
    'All 7 players secretly select and lock in 1 Color Chip and 1 Stone Card from their hand simultaneously.',
  ruleSec2Step2Label: 'Step 2 [Sequential Reveal]',
  ruleSec2Step2Desc:
    'Once all 7 players lock in, all Color Chips are revealed first, followed shortly by all Stone Card numbers.',
  ruleSec2Step3Label: 'Step 3 [Placement Priority Order]',
  ruleSec2Step3Priority1:
    '1st Priority: Players who submitted a RAINBOW chip place first.',
  ruleSec2Step3Priority2:
    '2nd Priority: Higher Stone Card numbers place earlier (6 → 5 → ... → 0).',
  ruleSec2Step3Priority3:
    '3rd Priority (Tie-breaker): Clockwise order starting from the current First Player (👑).',
  ruleSec2StarterTip:
    '※ The last player to receive penalty points in a round becomes the First Player (👑) for the next round. (If no one takes penalty points, the current First Player stays unchanged.)',

  ruleSec3Title: '3. Cube Placement, Pass, & 13+ Overload',
  ruleSec3PlaceLabel: 'Cube Placement',
  ruleSec3PlaceDesc:
    'On your turn, place your Stone Cube on the Carrier matching your submitted chip (RED, GREEN, BLUE). A RAINBOW chip lets you choose any of the 3 Carriers.',
  ruleSec3PassLabel: 'Pass Rule (Once per Round · Reverse Order)',
  ruleSec3PassDesc:
    'On your regular placement turn, you may declare a Pass once per round. Passed players place their cubes after all regular turns finish, in reverse order of passing (last to pass places first — LIFO). You cannot pass again on your deferred LIFO turn.',
  ruleSec3OverloadLabel: '13+ Overload & Penalty (Core Rule)',
  ruleSec3OverloadDesc:
    'If placing your cube makes a Carrier sum reach 13 or higher, all previously stacked cubes on that Carrier (excluding the one just placed) are collected, and you take penalty points equal to the number of collected cubes. Only your newly placed cube remains on the Carrier, and the Carrier sum updates to that cube’s number.',
  ruleSec3OverloadExample:
    'Example: Placing [4] on a Carrier with 3 existing cubes (sum 11) reaches 15 (≥13)! The 3 previous cubes are collected for +3 penalty pts, leaving only the new [4] cube (sum 4).',

  ruleSec4Title: '4. Half-Time Settlement (After Round 7)',
  ruleSec4HandLabel: 'Full Hand Replenishment',
  ruleSec4HandDesc:
    'When Round 7 ends, all players receive a fresh full set of 7 Stone Cards (0–6) and 7 Color Chips for the 2nd Half.',
  ruleSec4CarrierLabel: 'Carriers Carried Over Intact',
  ruleSec4CarrierDesc:
    'Stones and current sums already stacked on the 3 Carriers (RED, GREEN, BLUE) are NOT reset and carry directly into Round 8.',
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
  rulesSummaryTitle: 'ルール概要（全14ラウンド・原作準拠）',
  rulesSummaryItem1:
    '毎ラウンド7人全員が同時にカラーチップ1個と石カード(0〜6)1枚を秘密裏に選択・提出します。',
  rulesSummaryItem2:
    'チップ公開→カード公開後、[レインボー優先＞高い数字＞先手から時計回り]の順で配置し、手番で1回パス（逆順後回し）が可能です。',
  rulesSummaryItem3:
    '台座の合計が13以上になると、直前まで積まれていた既存の石をすべて回収してその個数分の罰点を受け、今置いた新しい石1個だけが残ります。',
  rulesSummaryItem4:
    '第7R終了時は手札のみ再支給され台座の石は維持されます。全14R終了後、累積ペナルティ最下位2名が脱落！',

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

  // Round Phases & Placement Queue
  phase_SELECTION: '同時選択フェーズ',
  phase_REVEAL_CHIPS: '第1公開：カラーチップ公開',
  phase_REVEAL_CARDS: '第2公開：石カード＆配置順確定',
  phase_PLACEMENT_REGULAR: 'キューブ配置進行中',
  phase_PLACEMENT_PASSED: 'パス逆順(LIFO)配置中',
  phase_ROUND_END: 'ラウンド精算中',
  phaseDesc_SELECTION:
    '7人全員が同時にカラーチップ1個と石カード1枚を秘密裏に選択します ({submittedCount} / 7 完了)',
  phaseDesc_REVEAL_CHIPS:
    '全員のカラーチップが公開されました！続いて石カードの数字が公開されます...',
  phaseDesc_REVEAL_CARDS:
    '石カードが公開されました！[レインボー＞高い数字＞先手から時計回り]の順で配置順が確定しました。',
  phaseDesc_PLACEMENT_REGULAR:
    '確定した優先順に従って台座に石を配置するか、パス(1回のみ)を宣言します。',
  phaseDesc_PLACEMENT_PASSED:
    '通常配置が終わり、パスしたプレイヤーが逆順（最後にパスした人から）で石を配置します。',
  firstPlayerLabel: '先手プレイヤー:',
  placementQueueTitle: '今ラウンドの配置順キュー (Placement Queue)',
  placementQueueHint:
    '優先順：レインボーチップ ＞ 高い数字(6→0) ＞ 先手から時計回り',
  queueStatusPending: '待機',
  queueStatusActive: '配置手番',
  queueStatusPassed: 'パス(逆順待機)',
  queueStatusPlaced: '配置完了',
  hiddenCardLabel: '?',
  selectionDoneBadge: '選択完了',
  selectionSelectingBadge: '選択中...',

  // GameBoard - Header & Player Cards
  roundBadge: 'ROUND {round} / {maxRounds}',
  firstHalfLabel: '前半 (1〜7R)',
  secondHalfLabel: '後半 (8〜14R)',
  currentTurnLabel: '現在の配置手番:',
  leaveBtnShort: '退出',
  penaltyBadge: '罰点 {points}',
  remainingCardsLabel: '残り石カード',
  remainingCardsUnit: '{count}枚',
  remainingChipsLabel: '残りチップ',
  remainingChipsUnit: '{count}個',
  starterBadge: '先手',
  passWaitingBadge: 'パス待機',
  actedDoneBadge: '配置済',
  botThinkingStatus: 'AI思考中...',
  turnActiveStatus: '配置手番',

  // GameBoard - 3-Color Carrier Pillars
  carrierSectionTitle: '3色の台座 (Carrier)',
  carrierSectionDesc:
    '石は各台座の上に1段目左→右→2段目左の順に積まれ、合計が13以上になると直前の石をすべて回収(個数分の罰点)し、新しい石1個だけが残ります。',
  lastSubmittedLabel: '直前の配置:',
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
    '直近の13オーバー({round}R · [{carrier}] 台座): {playerName}さんが合計{finalSum}に達し、既存の石{collectedCount}個を回収(罰点+{penalty}点)して新しい石[{newBaseSum}]だけが残りました。',
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

  // PlayerHand - Selection & Placement Modes
  selectionPromptPending:
    '同時選択フェーズ — 今ラウンドに提出する石カード(0〜6)1枚とカラーチップ1個を秘密裏に選んでください',
  selectionPromptLocked:
    '提出完了！他のプレイヤーの選択が終わるまでお待ちください ({submittedCount} / 7 完了)',
  revealWaitPrompt:
    '提出されたチップと石カードを公開し、配置順序を確定しています...',
  placementMyTurnPrompt:
    'あなたの配置手番！ — 今すぐ台座に配置するか、パス（逆順後回し）を選択してください',
  placementOtherTurnPrompt:
    '{playerName}さんの配置手番が進行中です',
  myLockedSubmissionLabel: '今ラウンドの提出セット:',
  projectedSumPreview:
    '[{carrier}] 配置時合計: {currentSum} + {card} = {projectedSum} {status}',
  projectedStatusExplode:
    '💥 (13オーバー！既存の石{collectedCount}個回収・罰点+{collectedCount}点)',
  projectedStatusSafe: '(安全)',
  handCardsHeader: '所持石カード ({count}枚)',
  handCardsHintWithTarget:
    '[{carrier}] 台座(現在合計 {sum}、石 {stonesCount}個)基準で13オーバー危険を表示中',
  handCardsHintNoTarget:
    'チップを選択すると対象の台座基準で13オーバー危険が表示されます',
  cardTileBlastLabel: '13オーバー！',
  cardTileNormalLabel: '石カード',
  handChipsHeader: '所持カラーチップ ({count}個)',
  handChipsHint:
    'レインボーチップは配置優先順1位となり、配置時に好きな色の台座を選べます',
  chipCarrierSumShort: '(合計:{sum})',
  selectedBadge: '選択中',
  rainbowTargetPrompt:
    'レインボーチップ対象台座の選択 — どの色の台座に石を配置しますか？',
  rainbowTargetSub: '現在合計: {sum} / 13 (既存の石 {count}個)',
  lockInSelectionBtnActive: '石 [{card}] + [{chip}] を秘密裏に提出する',
  lockInSelectionBtnDisabled:
    '提出する石カード1枚とカラーチップ1個を選択してください',
  lockInDoneBtn: '今ラウンドの提出完了（待機中）',
  passTurnBtn: 'パスする（逆順後回し・1回）',
  placeNowBtnActive: '[{carrier}] 台座に石 [{card}] を今すぐ配置する',
  placeNowBtnSelectTarget: '配置する対象の台座（赤・緑・青）を選択してください',

  // Validation & Error Codes
  err_ALREADY_PLAYING: 'すでに進行中のゲームには途中参加できません。',
  err_ROOM_FULL: '7人スロットがすべて人間プレイヤーで満員です。',
  err_TARGET_NOT_FOUND: '対象プレイヤーが見つかりません。',
  err_NOT_HALF_TIME: '中間精算フェーズではありません。',
  err_NOT_PLAYING: '現在ゲーム進行中ではありません。',
  err_NOT_SELECTION_PHASE: '現在は同時選択フェーズではありません。',
  err_ALREADY_SUBMITTED: 'このラウンドではすでに選択を提出済みです。',
  err_NOT_YOUR_TURN: 'あなたの配置手番ではありません。',
  err_PLAYER_NOT_FOUND: 'プレイヤー情報が存在しません。',
  err_CANNOT_PASS: 'このラウンドではすでにパスを使用したか、パスできません。',
  err_CARD_NOT_OWNED: '所持していない石カードです。',
  err_CHIP_NOT_OWNED: '所持していないカラーチップです。',
  err_RAINBOW_TARGET_REQUIRED:
    'レインボーチップ配置時は石を載せる対象の台座（赤・緑・青）を選択してください。',
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
    '前半(1〜7ラウンド)が開始されました！全員同時にカラーチップ1個と石カード1枚を選択してください。',
  log_ROUND_STARTED:
    '第{round}ラウンドの同時選択が開始されました。(現在の先手: {playerName})',
  log_SECOND_HALF_STARTED:
    '後半・第{round}ラウンドが開始されました！(先手: {playerName})',
  log_HALF_TIME_REACHED:
    '前半(第7ラウンド)が終了しました！手札(石カード7枚・チップ7個)のみ再支給され、台座に積まれた石と合計はそのまま維持されます。',
  log_CHIPS_REVEALED:
    '7人全員の選択が完了し、カラーチップが一斉に公開されました！',
  log_CARDS_REVEALED:
    'すべての石カードが公開され、優先順に従って配置順序が確定しました。',
  log_PASS_TURN:
    '{playerName}さんが配置をパスしました！（通常配置終了後に逆順で配置します）',
  log_SUBMIT_NORMAL:
    '{playerName}さんが [{carrier}] 台座に石 [{card}] を配置しました。(合計: {previousSum} → {newSum})',
  log_SUBMIT_RAINBOW:
    '{playerName}さんがレインボーチップで [{carrier}] 台座に石 [{card}] を配置しました。(合計: {previousSum} → {newSum})',
  log_EXPLOSION:
    '💥 [{carrier}] 台座 13オーバー！合計が{newSum}に達し、既存の石{collectedCount}個が回収され{playerName}さんが罰点+{penaltyAdded}点を受けました！(新しい石[{newBaseSum}]のみ台座に残留)',
  log_STARTER_UPDATED:
    '今ラウンド最後に罰点を受けた{playerName}さんが次ラウンドの先手プレイヤーになります。',
  log_BOT_TAKEOVER:
    '{playerName}さんの接続が切断され、ローカルAIボットが即座にスロットを引き継ぎました。',
  log_GAME_OVER:
    '全14ラウンド終了！累積ペナルティ最下位2名が脱落: {eliminatedList}',
  log_ELIMINATED_ITEM: '{name}(罰点 {points}点)',

  // Rulebook Modal (RuleModal.tsx)
  ruleBtnLabel: 'ルール',
  ruleBtnTooltip: 'ゲームルールを見る (?)',
  ruleModalBadge: 'OFFICIAL RULEBOOK',
  ruleModalTitle: 'ヘビー13 — ゲームルールガイド',
  ruleModalSubtitle:
    '同時選択 · 順次公開 · 逆順パス(LIFO) · 13オーバー回収精算',
  ruleModalCloseBtn: 'ルールを閉じる',
  ruleTabAll: '全体要約',
  ruleTabFlow: '配置・パス',
  ruleTabOverload: '13オーバー・罰点',

  ruleSec1Title: '1. ゲーム概要と勝利条件',
  ruleSec1PlayersLabel: '参加人数・ラウンド',
  ruleSec1PlayersDesc:
    '7人（人間プレイヤー＋不足分はAIボット）で前半(1〜7R)と後半(8〜14R)の計14ラウンドを戦います。',
  ruleSec1ResourcesLabel: '初期支給リソース',
  ruleSec1ResourcesDesc:
    '各自に石カード7枚(0〜6)とカラーチップ7個(RED x2, GREEN x2, BLUE x2, RAINBOW x1)が支給されます。',
  ruleSec1WinLabel: '勝敗判定',
  ruleSec1WinDesc:
    '14ラウンド終了後、累積罰点が最も多い最下位2名が脱落し、残りの5名が生存します。',

  ruleSec2Title: '2. 毎ラウンドの進行順序',
  ruleSec2Step1Label: 'ステップ1 [同時選択]',
  ruleSec2Step1Desc:
    '7人全員が同時に手札からカラーチップ1個と石カード1枚を秘密裏に選んで提出します。',
  ruleSec2Step2Label: 'ステップ2 [順次公開]',
  ruleSec2Step2Desc:
    '全員の提出完了後、まずカラーチップが一斉に公開され、続いて石カードの数字が公開されます。',
  ruleSec2Step3Label: 'ステップ3 [配置優先順位の決定]',
  ruleSec2Step3Priority1:
    '第1優先: RAINBOWチップを出したプレイヤーが最優先で配置します。',
  ruleSec2Step3Priority2:
    '第2優先: 石カードの数字が高い順(6 → 5 → ... → 0)に配置します。',
  ruleSec2Step3Priority3:
    '第3優先: 同条件の場合は現在の先手プレイヤー(👑)から時計回りの順になります。',
  ruleSec2StarterTip:
    '※ そのラウンドで最後に罰点を受けたプレイヤーが、次ラウンドの先手プレイヤー(👑)になります。（罰点を受けた人がいなければ現在の先手プレイヤーが維持されます。）',

  ruleSec3Title: '3. キューブ配置・パス(Pass)・13オーバー精算',
  ruleSec3PlaceLabel: 'キューブ配置',
  ruleSec3PlaceDesc:
    '自分の手番で提出したチップの色(RED, GREEN, BLUE)の台座に石キューブを載せます。RAINBOWチップは好きな色の台座を自由に選べます。',
  ruleSec3PassLabel: 'パスルール (ラウンド1回 · 逆順後配置)',
  ruleSec3PassDesc:
    '通常の配置手番でラウンドにつき1回パスできます。パスしたプレイヤーは通常配置がすべて終わった後、パスを宣言した順の逆順（最後にパスした人からLIFO）で配置します。（パス後に回ってきた逆順手番では再パスできず、必ず配置しなければなりません。）',
  ruleSec3OverloadLabel: '13以上の爆発と罰点 (核心ルール)',
  ruleSec3OverloadDesc:
    'キューブを載せて特定の台座の合計が13以上になると、今載せたキューブを除く既存のキューブがすべて回収され、回収された個数分の罰点を受けます。今載せた新しいキューブ1個だけが台座に残り、台座の合計はそのキューブの数字に更新されます。',
  ruleSec3OverloadExample:
    '例: 既存の石3個(合計11)が積まれた台座に[4]を載せると合計15(≥13)で爆発！既存の石3個が回収されて罰点+3点となり、台座には新しい石[4](合計4)だけが残ります。',

  ruleSec4Title: '4. 中間精算 (第7ラウンド終了後)',
  ruleSec4HandLabel: '手札のみ全量再支給',
  ruleSec4HandDesc:
    '第7ラウンドが終わると、全プレイヤーの手札（石カード7枚・カラーチップ7個）のみ新しく再支給されます。',
  ruleSec4CarrierLabel: '台座の石・合計はそのまま維持',
  ruleSec4CarrierDesc:
    '3つの台座(RED, GREEN, BLUE)にすでに積まれている石と合計はリセットされず、そのまま第8ラウンドへ引き継がれます。',
};

export const translations: Record<Language, TranslationSchema> = {
  ko,
  en,
  ja,
};

export function detectInitialLanguage(): Language {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'ko' || saved === 'en' || saved === 'ja') {
        return saved;
      }
    } catch {
      // 무시
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

export function formatRoundPhaseTitle(
  lang: Language,
  roundPhase: RoundPhase,
  isPassedTurnOrder: boolean
): string {
  switch (roundPhase) {
    case 'SELECTION':
      return translate(lang, 'phase_SELECTION');
    case 'REVEAL_CHIPS':
      return translate(lang, 'phase_REVEAL_CHIPS');
    case 'REVEAL_CARDS':
      return translate(lang, 'phase_REVEAL_CARDS');
    case 'PLACEMENT':
      return isPassedTurnOrder
        ? translate(lang, 'phase_PLACEMENT_PASSED')
        : translate(lang, 'phase_PLACEMENT_REGULAR');
    case 'ROUND_END':
      return translate(lang, 'phase_ROUND_END');
  }
}

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

    case 'CHIPS_REVEALED':
      return translate(lang, 'log_CHIPS_REVEALED');

    case 'CARDS_REVEALED':
      return translate(lang, 'log_CARDS_REVEALED');

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
        newBaseSum: p.newBaseSum ?? 0,
        playerName: resolvedPlayerName,
        penaltyAdded: p.penaltyAdded ?? 0,
        collectedCount: p.collectedCount ?? 0,
      });

    case 'STARTER_UPDATED':
      return translate(lang, 'log_STARTER_UPDATED', {
        playerName: resolvedPlayerName,
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
