# AGENTS.md — 무거운 13 (Heavy 13)

## 1. 프로젝트 개요 및 목적
- **프로젝트명:** 무거운 13 (Heavy 13 / ヘビー13)
- **성격:** 넷플릭스 예능 <데블스 플랜: 데드 어게인>의 게임 메커니즘에서 영감을 받아 제작한 **비상업적 개인 팬 프로젝트(Fan-made Web Board Game)**
- **배포 타겟:** Cloudflare Pages (100% 정적 호스팅, 백엔드 서버/DB 없음)
- **핵심 아키텍처:** Host-Authoritative Star 토폴로지 기반 브라우저 간 WebRTC P2P (`PeerJS`) + 방장(Host) 로컬 실행 휴리스틱 AI 봇

---

## 2. 기술 스택 (Tech Stack)
- **Core:** React 19, TypeScript (Strict Mode), Vite
- **Styling & Icons:** Tailwind CSS, Lucide React
- **State Management:** Zustand (`src/store/useGameStore.ts`)
- **Networking:** PeerJS (`src/network/usePeerRoom.ts`)
- **Audio & Security:** Browser Native Web Audio API (`src/utils/soundEffects.ts`), Web Crypto API SHA-256 (`src/utils/cryptoAuth.ts`)
- **Localization:** 내장 타입 안전 번역 딕셔너리 (`src/i18n/translations.ts` — `ko`, `en`, `ja`)

---

## 3. 디렉토리 구조 및 책임 경계
```text
src/
├── components/
│   ├── PasswordGate.tsx      # SHA-256 해시 기반 입장 게이트 (URL 쿼리 ?room= 보존 필수)
│   ├── Lobby.tsx             # 방 생성/입장, 닉네임 설정, 초대 링크 공유
│   ├── GameBoard.tsx         # 상단 헤더, 2줄 카드형 7인 현황판, 중앙 3색 짐꾼 받침대 적층 보드
│   ├── PlayerHand.tsx        # 하단 엄지손가락 전용 컨트롤 독 (카드 0~6, 칩, 제출/패스/레인보우 선택)
│   ├── RuleModal.tsx         # 언제든 열람 가능한 3개 국어 게임 규칙 모달
│   └── LanguageSwitcher.tsx  # ko / en / ja 실시간 언어 전환기
├── engine/
│   ├── rules.ts              # 순수 함수 기반 상태 기계(State Machine) 및 룰 정산 로직 (DOM/React 의존 금지)
│   └── botAI.ts              # 동시 선택(Selection) 및 배치/패스(Placement) 휴리스틱 AI 봇 의사결정
├── i18n/
│   └── translations.ts       # 한국어(ko) 기준 엄격한 타입 검증이 적용된 다국어 사전
├── network/
│   └── usePeerRoom.ts        # PeerJS 연결, Host 상태 브로드캐스트, Guest 패 마스킹, 단절 시 봇 자동 전환
├── store/
│   └── useGameStore.ts       # 클라이언트 전역 상태 및 액션 디스패치
├── types/
│   └── game.ts               # 도메인 모델, RoundPhase, Carrier, P2P 메시지, SanitizedGameState 타입
└── utils/
    ├── cryptoAuth.ts         # Web Crypto API SHA-256 해싱 유틸리티
    └── soundEffects.ts       # Web Audio API 기반 실시간 프로시저럴 효과음 엔진
```

---

## 4. 핵심 게임 규칙 및 상태 기계 불변식 (Invariants)
에이전트가 게임 로직이나 UI를 수정할 때 아래 룰은 절대 깨뜨려서는 안 된다:

1. **인원 및 라운드:** 총 7인 고정(인간 + AI 봇), 전반부(1~7R) + 후반부(8~14R) 총 14라운드.
2. **초기 자원:** 바위 카드 7장(`0`~`6`), 색깔 칩 7개(`RED` x2, `GREEN` x2, `BLUE` x2, `RAINBOW` x1).
3. **라운드 페이즈 흐름 (`RoundPhase`):**
   - `SELECTION`: 7명 전원이 동시에 칩 1개와 카드 1장을 비밀리에 제출.
   - `REVEAL_CHIPS`: 전원 제출 완료 후 **색깔 칩만 먼저 일제히 공개**.
   - `REVEAL_CARDS`: **바위 카드 공개** 및 배치 우선순위 정렬 확정.
   - `PLACEMENT`: 정렬된 순서대로 한 명씩 큐브 배치 또는 패스 진행.
   - `ROUND_END`: 전원 배치 완료 후 다음 라운드 선 플레이어 갱신 및 라운드 전진.
4. **배치 우선순위 정렬 규칙:**
   - ① `RAINBOW` 칩 제출자 최우선 → ② 바위 카드 숫자가 높은 순(`6 > 5 > 4 > 3 > 2 > 1 > 0`) → ③ 동순위 시 현재 **선 플레이어(`startPlayerId`)** 기준 시계 방향 순.
5. **패스(Pass) 규칙:**
   - 플레이어당 라운드별 1회 자신의 배치 차례에 패스 선언 가능(패스로 뒤로 밀린 재차례에는 패스 불가).
   - 패스하지 않은 모든 플레이어의 배치가 끝난 뒤, 패스한 플레이어들이 **패스를 선언한 순서의 역순(LIFO)**으로 큐브를 배치.
6. **13 이상 폭발 정산 규칙 (중요):**
   - 큐브 배치 직후 해당 색상 받침대(`RED`, `GREEN`, `BLUE`)의 합계가 `13` 이상이 되면:
     1. 방금 배치한 큐브를 **제외한**, 배치 직전까지 해당 받침대에 놓여 있던 기존 큐브들을 모두 수거(제거)한다.
     2. 해당 플레이어는 **수거된 기존 큐브의 개수**만큼 벌점을 받는다(`penaltyPoints += collectedCount`).
     3. 방금 배치한 **신규 큐브 1개만 해당 받침대에 남고**, 받침대 합계는 그 큐브의 숫자로 갱신된다.
7. **선 플레이어 승계 및 7라운드 중간 정산:**
   - 1라운드는 방장(슬롯 `#1`)이 선 플레이어로 시작하며, 매 라운드 종료 시 **해당 라운드에서 가장 마지막으로 벌점을 받은 플레이어**가 다음 라운드 선 플레이어가 된다(벌점자가 없으면 기존 선 플레이어 유지).
   - **7라운드 종료 후(8라운드 시작 시):** 모든 플레이어의 **손패(카드 7장, 칩 7개)만 새로 재지급**하며, **3개 받침대에 쌓여 있던 돌(`stones`)과 합계(`sum`)는 초기화하지 않고 그대로 유지**한다.
8. **최종 승패 및 탈락 판정 (14라운드 종료):**
   - 14라운드 종료 후 누적 벌점이 가장 높은 **최하위 2명이 최종 탈락**하고, 나머지 5명이 생존한다.

---

## 5. 아키텍처, 보안 및 UI 개발 규칙
- **엔진 순수성 유지:** `src/engine/rules.ts`와 `src/engine/botAI.ts`에는 React 훅, `window`, DOM 접근 코드를 절대 넣지 않는다.
- **P2P 치팅 방지 마스킹:** Host가 Guest에게 전송하는 `SanitizedGameState`에는 반드시 해당 Guest 본인의 손패만 포함하고, 타인의 보유 패는 남은 개수(`remainingCards`, `remainingChips`)만 노출한다. `SELECTION` 단계에서는 타인의 제출 칩/카드 값을 모두 `null`로 마스킹하고, `REVEAL_CHIPS` 단계에서는 타인의 제출 `chip`만 공개하며 `card`와 `placementQueue`는 `REVEAL_CARDS` 단계까지 마스킹한다.
- **다국어(i18n) 분리:** P2P 메시지와 상태 스토어 내부에서는 영문 상수(`'RED'`, `'RAINBOW'`, `'PASS'`)와 구조화된 이벤트 데이터만 전달하고, 모든 사용자 노출 문자열은 각 클라이언트 로컬의 `t()` 함수를 통해 `ko`/`en`/`ja`로 렌더링한다.
- **모바일 퍼스트 단일 뷰포트(`100dvh`) 준수:**
  - 게임 보드 화면(`GameBoard.tsx`)은 모바일 세로 화면(360px~430px)에서 세로/가로 스크롤이나 하단 버튼 잘림이 발생하지 않도록 `h-dvh overflow-hidden` 레이아웃을 유지한다.
  - 상단 헤더의 라운드/선 플레이어 왕관 배지 및 유틸리티 버튼은 모바일 폭에서 테두리가 잘리거나 겹치지 않도록 `shrink-0` 및 컴팩트 패딩을 유지한다.
  - 모바일 `<input>` 요소는 iOS Safari 자동 줌 방지를 위해 최소 `text-base` (`16px`) 이상을 유지한다.
  - 돌 타일 제출자 정보 툴팁은 Hover뿐만 아니라 모바일 터치(Click/Tap) 토글로도 동작해야 한다.
- **외부 오디오 에셋 금지:** 효과음은 외부 `.mp3`/`.wav` 파일 없이 `src/utils/soundEffects.ts`의 Web Audio API 합성기만 사용한다.