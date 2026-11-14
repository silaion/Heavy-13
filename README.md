# 무거운 13 (Heavy 13 / ヘビー13)

> **⚠️ 면책 조항 및 프로젝트 성격 안내 (Disclaimer)**
> 본 프로젝트는 넷플릭스 예능 **<데블스 플랜: 데드 어게인>**에 등장한 게임 규칙에서 영감을 받아 **개발자 개인의 학습 및 지인들과의 비영리적 플레이 목적**으로 직접 설계·구현한 개인 토이 프로젝트(Fan-made Project)입니다.
> 원작 프로그램 및 제작사(넷플릭스, TEO 등)와는 어떠한 공식적인 관련도 없으며, 상업적 목적으로 사용되지 않습니다.

---

## 📖 프로젝트 소개

**무거운 13 (Heavy 13)**은 7명의 플레이어가 숫자가 적힌 바위 카드와 색깔 칩을 조합해 3개의 짐꾼 받침대(빨강, 초록, 파랑) 위에 돌을 쌓아 올리며, 각 받침대의 숫자 합이 **13 이상**이 되지 않도록 버티는 심리·수싸움 웹 보드게임입니다.

별도의 백엔드 게임 서버나 데이터베이스(No-DB) 없이 **브라우저 간 WebRTC P2P 직접 통신**과 **로컬 휴리스틱 AI 봇**을 결합하여, 정적 웹 호스팅(Cloudflare Pages)만으로 1인 솔로 플레이부터 7인 실시간 멀티플레이까지 즉시 즐길 수 있도록 구현했습니다.

---

## ✨ 주요 기능

* **No-DB 브라우저 간 WebRTC P2P 멀티플레이:**
  * PeerJS 기반 Host-Authoritative Star 토폴로지를 적용하여 방장(Host) 브라우저가 단일 게임 상태 권한을 갖고 참가자(Guest)들과 실시간 상태를 동기화합니다.
  * 치팅 방지를 위해 각 참가자에게는 본인의 손패만 전송하고 타인의 패는 남은 개수만 마스킹하여 동기화합니다.
* **하이브리드 로컬 AI 봇 (1~7인 유연한 플레이):**
  * 7명의 슬롯 중 실제 접속자가 없는 빈자리는 방장 브라우저 내에서 동작하는 경량 휴리스틱 AI 봇이 자동으로 채웁니다.
  * 게임 도중 참가자의 네트워크 연결이 끊기더라도 즉시 AI 봇으로 전환되어 게임이 중단되지 않고 14라운드까지 완주됩니다.
* **직관적인 3색 짐꾼 받침대 적층 UI & 상호작용:**
  * 빨강(RED), 초록(GREEN), 파랑(BLUE) 3개의 받침대 위에 돌 타일이 2열 그리드로 아래에서 위로 쌓이는 시각적 보드를 제공합니다.
  * 쌓인 돌을 클릭(터치)하거나 마우스를 올리면 해당 돌을 제출한 플레이어 닉네임과 사용 칩 정보를 확인할 수 있습니다.
* **Web Audio API 실시간 합성 효과음:**
  * 외부 오디오 에셋 없이 브라우저 내장 Web Audio API로 돌 안착음, 칩 선택음, 패스음, 13 폭발 경고음을 실시간으로 생성하며 상단 헤더에서 음소거를 제어할 수 있습니다.
* **3개 국어 다국어 지원 (i18n):**
  * 한국어(`ko`), 영어(`en`), 일본어(`ja`) UI 전환을 지원하며, 각 플레이어가 자신의 브라우저에서 선택한 언어로 게임 로그와 인터페이스를 동시에 이용할 수 있습니다.
* **클라이언트 SHA-256 비밀번호 게이트:**
  * Web Crypto API(`SHA-256`) 단방향 해시 검증을 통해 지정된 비밀번호를 입력한 지인만 로비 및 초대 방에 입장할 수 있습니다.

---

## 🎮 게임 규칙 요약 (하우스 룰 반영)

1. **인원 및 라운드:** 총 7인 고정, 전반부(1~7라운드)와 후반부(8~14라운드)로 구성된 총 14라운드를 진행합니다.
2. **초기 지급 자원:** 전반부 시작 시 전원에게 바위 카드 7장(`0`~`6`)과 색깔 칩 7개(`RED` x2, `GREEN` x2, `BLUE` x2, `RAINBOW` x1)가 지급됩니다.
3. **턴 진행 및 13 폭발:**
   * 자신의 턴에 카드 1장과 칩 1개를 조합해 해당 색깔 받침대에 돌을 올리거나 패스합니다.
   * 특정 받침대의 숫자 합이 **13 이상**이 되는 순간 해당 턴 플레이어가 벌점을 획득하고, 해당 받침대만 `0`으로 초기화됩니다.
4. **중간 정산 (7라운드 종료 후):** 8라운드 시작 시 모든 플레이어의 손패(카드·칩)만 새로 재지급되며, **기존 3개 받침대에 쌓여 있던 돌과 합계는 그대로 유지**됩니다.
5. **승패 결정:** 14라운드 종료 후 누적 벌점이 가장 높은 최하위 2명이 탈락합니다.

---

## 🛠 기술 스택 (Tech Stack)

* **Frontend:** React 19, TypeScript (Strict Mode), Vite
* **Styling & Icons:** Tailwind CSS, Lucide React
* **State Management:** Zustand
* **Networking:** PeerJS (WebRTC `RTCDataChannel`)
* **Audio & Security:** Browser Native Web Audio API, Web Crypto API (`SHA-256`)
* **Deployment:** Cloudflare Pages (Static Hosting)

---

## 📁 프로젝트 구조

```text
src/
├── components/       # UI 컴포넌트 (PasswordGate, Lobby, GameBoard, PlayerHand, LanguageSwitcher)
├── engine/           # 순수 함수 기반 게임 룰 엔진(rules.ts) 및 휴리스틱 AI 봇(botAI.ts)
├── i18n/             # 한국어/영어/일본어 번역 사전 및 훅
├── network/          # PeerJS 기반 WebRTC 방 생성/입장 및 상태 브로드캐스트 훅
├── store/            # Zustand 전역 게임 상태 스토어
├── types/            # 도메인 모델, P2P 메시지 프로토콜, Sanitized 뷰 모델 타입 정의
└── utils/            # Web Audio 효과음 합성기 및 SHA-256 해시 검증 유틸리티
```

---

## 🚀 로컬 실행 및 배포 방법

### 1. 의존성 설치 및 개발 서버 실행
```bash
npm install
npm run dev
```

### 2. 입장 비밀번호 해시 설정 (`.env`)
원하는 비밀번호를 SHA-256 해시로 변환한 뒤 프로젝트 루트의 `.env` 파일(또는 Cloudflare Pages 환경 변수)에 등록합니다.

```bash
# 비밀번호 SHA-256 해시 생성 예시
node -e "console.log(require('crypto').createHash('sha256').update('your-password').digest('hex'))"
```

```env
VITE_APP_PASSCODE_HASH=생성된_64자리_SHA256_해시값
```

### 3. 프로덕션 빌드 및 Cloudflare 배포 (Wrangler)
```bash
# 정적 프로덕션 빌드 (dist 생성)
npm run build

# Wrangler 로컬 프리뷰 서버 실행
npm run cf:dev

# Cloudflare Workers Static Assets 배포 (wrangler.jsonc 기준)
npm run deploy

# 또는 Cloudflare Pages 직접 배포
npm run deploy:pages
```
* **Build command:** `npm run build`
* **Build output directory:** `dist`
* **Config file:** `wrangler.jsonc` (`assets.directory: "./dist"`, `not_found_handling: "single-page-application"`)

---

## 📌 라이선스 및 저작권 안내

* 본 리포지토리의 소스 코드는 개발자 개인의 학습 및 포트폴리오·취미 목적으로 작성되었습니다.
* 게임의 기본 콘셉트와 명칭에 대한 권리는 원저작권자에게 있으며, 무단 상업적 배포 및 영리 목적의 이용을 금합니다.