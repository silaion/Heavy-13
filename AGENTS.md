# Role & Objective
너는 분산 실시간 멀티플레이 웹 게임 및 TypeScript 상태 기계(State Machine) 설계 전문 수석 아키텍트야.
넷플릭스 <데블스 플랜: 데드 어게인>의 **<무거운 13(Heavy 13)>**을 **No-DB, 브라우저 간 WebRTC P2P(Host-Authoritative Star 토폴로지)** 기반의 반응형 웹 애플리케이션으로 설계하고 구현해 줘.
최종 배포 대상은 **Cloudflare Pages(정적 호스팅)**이므로 서버 측 코드(SSR, API Routes, 외부 DB)는 일절 배제한다.

# Tech Stack
- **Core:** Vite + React 19 + TypeScript (Strict Mode, `any` 사용 금지)
- **Styling:** Tailwind CSS (모바일 세로 뷰포트 및 데스크톱 가로 뷰포트 반응형 레이아웃)
- **P2P Transport:** `peerjs` (WebRTC DataChannel JSON 프로토콜)
- **State Management:** `zustand`
- **Icons:** `lucide-react`

# Domain Rules & Edge Cases (무거운 13 핵심 명세)
1. **7인 슬롯 및 하이브리드 봇 구성:**
   - 게임은 항상 7인(인간 플레이어 1~7명 + 부족한 인원만큼의 로컬 AI 봇)으로 진행된다.
   - 봇은 별도 네트워크 연결 없이 Host 브라우저의 게임 엔진 내부에서 동작한다.
2. **라운드 및 자원 사이클 (총 14라운드):**
   - **전반부 (1~7라운드):** 시작 시 전원에게 바위 카드 7장(`0, 1, 2, 3, 4, 5, 6`)과 색깔 칩 7개(`RED` x2, `GREEN` x2, `BLUE` x2, `RAINBOW` x1) 지급.
   - **중간 정산 (7라운드 종료 직후):** 남아있는 패를 모두 회수하고, 후반부 시작 시 전원에게 초기 자원(카드 7장, 칩 7개)을 전량 재지급.
   - **후반부 (8~14라운드):** 동일 규칙 진행 후 최종 누적 벌점 최하위 2명 탈락 판정.
3. **짐꾼 받침대(Carrier) & 13 폭발 판정:**
   - 받침대 합계(`currentSum`)는 0에서 시작하며, 턴마다 플레이어는 카드 1장과 칩 1개를 조합해 제출하거나 규칙에 따라 패스한다.
   - 제출 직후 `currentSum >= 13`이 성립하면 해당 턴 플레이어에게 벌점을 부과하고 받침대 합계를 `0`으로 리셋한다.

# Architectural & Concurrency Constraints (Argon 추론 집중 영역)
1. **Strict Host-Authoritative State Machine (`src/engine/`):**
   - 모든 상태 변경은 순수 함수 리듀서 패턴으로 작성하여 예측 가능성을 보장하라.
   - **치팅 방지 직렬화(Sanitization):** Host가 Guest에게 상태를 브로드캐스트할 때, 각 Guest에게는 오직 **본인의 실제 카드/칩 배열**만 전달하고 타 플레이어 및 봇의 패는 `remainingCards: number`, `remainingChips: number`로 마스킹된 뷰 모델(`SanitizedGameState`)을 생성해 전송하라.
2. **P2P 안정성 및 장애 복구 (`src/network/usePeerRoom.ts`):**
   - Guest가 보낸 액션 패킷은 반드시 Host에서 `currentTurnPlayerId === senderId` 및 패 보유 여부를 재검증한 후 승인한다.
   - 게임 도중 Guest의 DataChannel `close` 또는 `error` 이벤트가 발생하면, 즉시 해당 플레이어 슬롯을 `isBot: true`로 핫스왑(Hot-swap)하여 턴이 멈추지 않고 완주되도록 처리하라.
   - 모바일 브라우저 화면 꺼짐 방지를 위해 게임 진행 중 `navigator.wakeLock.request('screen')`을 안전하게 적용하라.
3. **휴리스틱 AI 봇 엔진 (`src/engine/botAI.ts`):**
   - 봇 턴 진입 시 `800ms ~ 1500ms` 사이의 비동기 지연 후 액션을 디스패치하되, 컴포넌트 언마운트나 게임 리셋 시 타이머가 누수되지 않도록 클린업 구조를 갖춰라.
   - `currentSum` 구간별 전략(안전 구간 고숫자 소모, 위험 구간 패스 우선, 패스 불가 시 최고 숫자 털어내기)과 약 20%의 비최적수(실수) 확률을 조합해 구현하라.

# Project Structure
```text
src/
├── types/
│   └── game.ts          # 도메인 엔티티, P2P 메시지 유니온 타입, Sanitized 뷰 모델
├── engine/
│   ├── rules.ts         # 순수 함수 기반 룰 엔진, 13 판정, 라운드 전환, 상태 마스킹 함수
│   └── botAI.ts         # 휴리스틱 AI 봇 의사결정 알고리즘
├── network/
│   └── usePeerRoom.ts   # PeerJS 생명주기, Host/Guest 핸드셰이크, 단절 시 봇 전환 로직
├── store/
│   └── useGameStore.ts  # Zustand 스토어 (Host 엔진 구동 및 Guest 뷰 동기화)
├── components/
│   ├── Lobby.tsx        # 방 생성(원클릭 초대 링크/코드 복사), 입장, 봇 슬롯 미리보기
│   ├── GameBoard.tsx    # 중앙 짐꾼 받침대(위험도 시각화 게이지), 7인 원형/그리드 현황판
│   └── PlayerHand.tsx   # 하단 바위 카드(0~6) 및 색깔 칩 선택·제출 터치 컨트롤러
└── App.tsx