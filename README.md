# 🧩 큐알유(QRU): QR코드로 만드는 디지털 명함

`QRU`는 "**QR**" 과 "**Who Are You**"를 결합한 이름으로, 사용자가 자신의 정보를 입력하여 QR 코드를 생성하고 이를 통해 디지털 명함을 공유할 수 있는 웹 애플리케이션입니다.

QR 코드를 통해 손쉽게 자신을 소개하거나 랜덤 셔플 기능으로 새로운 친구를 만날 수 있습니다.

🔗 **[qryou-app.web.app](https://qryou-app.web.app)**

## 주요 기능 ✨

### 1. 디지털 명함 생성 🖋️

- **한 줄 자기소개**, **이름**, **성별**, **생년월일**, **이메일**, **SNS**, **MBTI**, **취미/관심사**, **좋아하는 것**, **싫어하는 것** 을 입력합니다. 생일과 나이는 생년월일에서 자동으로 계산됩니다.
- 원하는 항목을 **최대 5개**까지 더할 수 있습니다. 소속/회사, 직무/직책, 연락처, 웹사이트 등에서 고르거나 제목을 직접 적습니다.
- 왼쪽 목차에서 어디까지 채웠는지 보고, 눌러서 그 항목으로 건너뛸 수 있습니다.
- 취미처럼 표기가 갈리기 쉬운 항목은 **추천 값을 눌러 넣을 수 있습니다.** 같은 말을 같은 표기로 적게 해 검색 정확도를 올립니다.
- 사진을 넣고 **위치와 크기를 직접 맞출 수 있습니다.** 원 안이 그대로 명함에 들어갑니다. 원보다 작게 줄여 사진 전체를 담을 수도 있습니다.
- 배경이 없는 그림은 투명한 채로 저장됩니다.
- **회원가입 없이 사용할 수 있습니다.** 만든 명함은 이 브라우저에 묶여, 로그인하지 않아도 고치고 지울 수 있습니다.

### 2. 내 명함 관리 🛠️

- 로그인하면 **만든 명함을 모아 봅니다.** 이름, 일련번호, 만든 날짜, 셔플 노출 여부가 한눈에 들어옵니다. 카드를 누르면 그 명함으로 갑니다.
- 내 명함을 보고 있으면 그 자리에서 **고치거나 지울 수 있습니다.** 저장했던 입력 원본을 그대로 불러오므로, 공개로 두지 않았던 항목도 값이 남아 있습니다.
- 수정해도 **공유한 주소와 QR 코드, 일련번호는 그대로입니다.**
- 삭제하면 사진과 입력 원본까지 함께 지워집니다.

### 3. 명함 보기와 공유 🔗

- 명함마다 고유 주소(`/cards/{id}`)가 있습니다.
- QR 코드를 **PNG 로 내려받거나** 링크를 복사해 공유합니다.
- 사람이 옮겨 적을 수 있는 일련번호(예: `7K3FM-9P2XR`)도 함께 발급됩니다. 눌러서 복사할 수 있습니다.
- **일련번호로 명함을 찾을 수 있습니다.** 헤더의 돋보기에 번호를 적으면 그 명함으로 갑니다. 소문자로 적거나 붙임표를 빼먹어도 됩니다.

### 4. 명함 찾기 🔄

- 공개된 명함 중에서 무작위로 **다섯 장**을 골라 보여줍니다. 카드를 누르면 그 명함으로 갑니다.
- **조건 필터**: 성별, MBTI, SNS 종류 등 공개 항목이면 무엇으로든 좁힐 수 있습니다.
- **검색어**: 부분 일치로 훑습니다. "등산", "INFP", "3월" 처럼 아무 항목이나 걸립니다.
- 명함을 만들 때 **셔플 노출 여부를 직접 고릅니다.**

### 5. 정보 공개 설정 🔒

- 항목마다 공개 여부를 따로 정합니다.
- 비공개로 둔 항목은 **화면에서 숨기는 것이 아니라 공개 문서에 아예 저장되지 않습니다.** 자세한 내용은 [데이터 구조](#데이터-구조-)를 참고하세요.

### 6. 그 외

- 다크 / 라이트 테마를 지원합니다.
- 모바일(~768px), 태블릿(~1024px), 데스크톱(1025px~) 에 맞춰 레이아웃이 달라집니다.

## 화면 구성 📱

| 경로 | 화면 | 상태 |
| --- | --- | --- |
| `/` | 홈. 서비스 소개와 명함 생성 모달 | ✅ |
| `/cards/:id` | 명함 보기. QR 코드 다운로드와 링크 복사 | ✅ |
| `/cards/shuffle` | 명함 찾기. 조건 필터와 검색 | ✅ |
| `/mypage` | 내 명함 관리. 목록 · 수정 · 삭제 | ✅ |

로그인은 Firebase Authentication 의 **Google 계정 로그인**을 씁니다.

로그인하지 않고 만든 명함도 관리할 수 있습니다. 명함을 만들 때 **익명 로그인**으로 uid 를 하나 발급해 소유자로 둡니다. 소유권을 uid 로 가리는 규칙을 그대로 쓰기 위한 것이라, 화면에서는 로그인한 것으로 치지 않습니다.

그 uid 는 브라우저에 저장되므로 **지우거나 다른 기기로 옮기면 되찾을 수 없습니다.** 로그인하면 그 자리에 계정을 붙여(`linkWithPopup`) uid 를 유지하므로, 그때까지 만든 명함이 그대로 따라옵니다.

## 기술 스택 🔧

### 프론트엔드 🖥️

- **React 18** (TypeScript) + **Vite**
- **styled-components**: 테마 기반 스타일링
- **Redux Toolkit**: 인증 · 모달 · 토스트 등 전역 UI 상태
- **react-query**: 서버 상태 관리
- **react-router-dom v7**

### 백엔드 및 인증 🛡️

- **Firebase Firestore**: 명함 데이터
- **Firebase Authentication**: Google 계정 로그인
- **Firebase Hosting**: 배포

별도의 서버나 Cloud Functions 는 두지 않았습니다. 브라우저가 Firestore 에 직접 읽고 쓰며, 권한은 전부 [`firestore.rules`](firestore.rules) 에서 막습니다.

### 기타 🚀

- **qrcode.react**: QR 코드 생성
- **react-datepicker**, **react-icons**
- **Playwright**: PR 스크린샷 자동 생성 (`npm run screenshots`)

## 데이터 구조 📂

명함 한 장은 **세 개의 문서**로 나뉩니다.

```bash
serials/{일련번호}            # 일련번호 -> 명함 길잡이
├── collection               # cards 인지 guestCards 인지
├── cardId                   # 명함 문서 id
└── uid                      # 지울 때 소유자를 확인하려고 함께 둔다

cards/{id}                   # 명함 (예전 비회원 명함은 guestCards/{id})
├── serialNumber             # 사람이 옮겨 적는 일련번호
├── uid                      # 소유자. 로그인하지 않았다면 익명 uid
├── createdAt                # 서버 시각
├── entries[]                # 공개 항목만. { id, label, value }
├── search{}                 # 조건 검색용 색인. 항목 id -> 정규화된 값
├── inShuffle                # 셔플 노출 여부
├── hasPhoto                 # 사진 문서가 있는지
│
├── private/card             # 소유자만 접근
│   ├── values{}             # 입력 원본 (비공개 항목 포함)
│   ├── isPublic{}           # 항목별 공개 설정
│   └── password{}           # 예전 비회원 비밀번호 해시. 새로 쓰지 않는다
│
└── photo/data               # 사진
    └── dataUrl              # 줄여서 담은 JPEG 데이터 URL
```

**왜 나눴나** — Firestore 보안 규칙은 문서 단위로만 동작하고 **필드 하나를 가릴 수 없습니다.** 비공개 항목을 공개 문서에 넣어두고 화면에서만 숨기면, 문서를 직접 읽는 것만으로 새어나갑니다. 그래서 저장 단계에서 갈라둡니다.

**`search` 가 따로 있는 이유** — `entries` 는 화면에 뿌리기 좋은 배열이지만, Firestore 는 배열 원소의 특정 필드로 거르는 질의를 지원하지 않습니다. 조건 검색을 위해 같은 내용을 맵으로 한 번 더 저장합니다. 이 결정에 이르기까지의 과정은 [`docs/troubleshooting.md`](docs/troubleshooting.md) 에 적어두었습니다.

**일련번호 길잡이가 따로 있는 이유** — 보안 규칙은 질의에 담긴 값을 알 수 없어, `serialNumber` 로 거르는 목록 조회를 열 방법이 없습니다. 목록 조회를 통째로 열면 남의 명함을 훑어 내려갈 수 있습니다. 그래서 일련번호 자체를 문서 id 로 삼아 한 번 읽고 찾아갑니다.

**사진을 Firestore 에 넣는 이유** — Firebase Storage 를 쓰지 않아 문서에 데이터 URL 로 담습니다. 대신 클라이언트에서 긴 변 512px, 150KB 이하로 줄이고 규칙에서도 같은 상한으로 막습니다. 셔플이 후보를 수십 장 가져올 때 사진까지 딸려오지 않도록 하위 문서로 떼어두었습니다.

## 프로젝트 구조 📂

```bash
QRU/
├── .github/workflows/        # Firebase Hosting 배포
├── docs/                     # 컨벤션 및 트러블슈팅 문서
├── scripts/
│   └── pr-screenshots.mjs    # PR 본문에 스크린샷을 붙이는 스크립트
├── src/
│   ├── api/                  # react-query 클라이언트
│   ├── components/
│   │   ├── card/             # 명함 보기 · QR 공유
│   │   ├── common/           # 버튼, 입력, 모달, 토스트 등
│   │   ├── form/             # 명함 생성 폼
│   │   ├── header/           # 내비게이션, 검색, 테마 전환
│   │   ├── home/             # 홈 화면과 생성 모달
│   │   └── layout/           # Header / Footer / Layout
│   ├── context/              # 테마 컨텍스트
│   ├── data/                 # 폼 항목 정의, 내비게이션 정의
│   ├── hooks/                # useCardForm 등 커스텀 훅
│   ├── pages/                # 라우트 페이지
│   ├── services/             # firebase 초기화, 명함 읽기/쓰기
│   ├── store/                # Redux 스토어와 슬라이스
│   ├── styles/               # 전역 스타일과 테마
│   ├── types/                # 공용 타입
│   └── utils/                # 검증, 직렬화, 이미지, 비밀번호
├── firestore.rules           # Firestore 보안 규칙
├── firebase.json
└── vite.config.ts
```

### 눈여겨볼 곳

- [`src/data/formFields.ts`](src/data/formFields.ts) — 명함 항목이 전부 여기 정의되어 있습니다. 항목을 더하거나 빼려면 이 파일만 고치면 됩니다.
- [`src/utils/formValidation.ts`](src/utils/formValidation.ts) — `flattenFields` 가 항목 id 를 만드는 단일 기준입니다. 렌더링과 검증이 같은 규칙을 쓰도록 여기에 모아두었습니다.
- [`src/services/card.ts`](src/services/card.ts) — 명함을 읽고 쓰는 곳. 질의는 전부 "같음" 조건만 씁니다. 그래야 Firestore 가 단일 필드 색인을 합쳐 처리해서 복합 색인을 만들지 않아도 됩니다.
- [`firestore.rules`](firestore.rules) — 공개 문서의 키 목록은 `PublicCard` 타입과 **정확히 일치해야 합니다.** 한쪽에만 필드를 더하면 `hasOnly` 가 막아 생성이 통째로 거부됩니다.

## 시작하기 💡

```bash
npm install
npm run dev
```

Firebase 설정이 필요합니다. 저장소 루트에 `.env` 를 만들고 아래 값을 채웁니다. [Firebase 콘솔](https://console.firebase.google.com/)의 프로젝트 설정 > 내 앱 > SDK 설정에서 가져올 수 있습니다.

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=    # 선택. 없으면 Analytics 없이 동작합니다
```

설정이 없어도 앱은 뜨지만 명함 생성과 로그인이 막히고 화면에 안내가 표시됩니다.

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 타입 검사 후 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint |
| `npm run screenshots` | PR 본문에 스크린샷을 찍어 붙입니다 |

## 배포 🚀

`main` 에 push 하면 GitHub Actions 가 빌드해 Firebase Hosting 으로 내보냅니다. PR 에는 미리보기 채널이 붙습니다.

Firebase 웹 설정은 번들에 실려 어차피 공개되는 값이라 저장소 **Variables** 에 둡니다. 서비스 계정 키만 Secret 입니다.

**Firestore 보안 규칙은 배포에 포함되지 않습니다.** `firestore.rules` 를 고쳤다면 따로 내보내야 합니다.

```bash
firebase deploy --only firestore:rules
```

## 문서 📚

| 문서 | 내용 |
| --- | --- |
| [브랜치 컨벤션](docs/branch-convention.md) | 브랜치 이름 규칙 |
| [커밋 컨벤션](docs/commit-convention.md) | 커밋 메시지 규칙 |
| [이슈 컨벤션](docs/issue-convention.md) | 이슈 작성 규칙 |
| [트러블슈팅](docs/troubleshooting.md) | 데이터 구조가 지금 모습이 된 과정 |

## 앞으로 할 일 🤸‍♀️

- **명함 대량 생성 방지** — 익명 로그인도 얼마든지 새로 받을 수 있어, 이것만으로는 막히지 않습니다. App Check 또는 서버 검증이 필요합니다. ([#49](https://github.com/hyeoniverse/QRU/issues/49))
- **다른 기기에서 되찾기** — 브라우저를 지우면 로그인 전에 만든 명함을 되찾을 수 없습니다. 일련번호와 비밀번호로 확인하려면 서버가 필요합니다.
- **회원 / 비회원 컬렉션 통합 검토** — `cards` 와 `guestCards` 로 나뉘어 있어 조회할 때마다 양쪽을 봅니다. ([#32](https://github.com/hyeoniverse/QRU/issues/32))

## 팀원 및 역할 👥

### 김정현 🔗 [Hyeon](https://github.com/hyeoniverse)

- 기획 및 설계
- 프론트엔드 개발
- Firebase 연동 및 보안 규칙
