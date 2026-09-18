# 🧩 큐알유(QRU): QR코드로 만드는 디지털 명함

`QRU`는 "**QR**" 과 "**Who Are You**"를 결합한 이름으로, 사용자가 자신의 정보를 입력하여 QR 코드를 생성하고 이를 통해 디지털 명함을 공유할 수 있는 웹 애플리케이션입니다.

QR 코드를 통해 손쉽게 자신을 소개하거나 랜덤 셔플 기능으로 새로운 친구를 만날 수 있습니다.

## 주요 기능 ✨

### 1. 디지털 명함 생성 🖋️

- **이름(닉네임)**, **전화번호**, **성별**, **MBTI**, **취미**, **SNS 아이디** 등 정보를 입력해 QR 코드를 자동 생성합니다.
- 사용자가 원하는 추가 정보를 최대 5개까지 포함할 수 있습니다.
- 생성된 QR 코드는 다운로드하거나 URL로 공유할 수 있습니다.

### 2. 디지털 명함 관리 🛠️

- **회원가입 없이 사용 가능**: 비회원은 랜덤으로 발급된 일련번호로 자신의 명함을 관리할 수 있습니다.
- **회원가입 시 편리한 관리**: 로그인 후 생성한 명함을 자유롭게 수정 및 삭제할 수 있습니다.

### 3. 랜덤 셔플로 친구 만들기 🔄

- QRU의 랜덤 셔플 기능을 사용해 새로운 친구를 만날 수 있습니다.
- **필터링 옵션**: 랜덤 셔플 시 **성별**, **MBTI** 등 사용자가 원하는 조건으로 검색 범위를 좁힐 수 있습니다.

### 4. 정보 공개 설정 🔒

- 사용자는 명함에 포함된 정보를 선택적으로 공개할 수 있습니다.
    - 예: 특정 정보는 회원에게만 공개, 랜덤 셔플에서는 특정 정보 비공개, 특정 정보를 가진 사용자(성별, SNS 공개 등...)에게만 자신의 정보 공개.

### 5. 커스터마이징 🎨

- QR 코드 및 명함 디자인을 선택하여 개인 맞춤형 명함을 생성할 수 있습니다.

## 사용 방법 💡

1. **명함 생성**
    - 사이트에서 정보를 입력하고 "QR 코드 생성" 버튼을 클릭합니다.
    - 생성된 QR 코드를 다운로드하거나 URL로 공유합니다.
2. **명함 관리**
    - 회원가입 사용자: 로그인 후 명함을 편집하거나 정보 공개 설정을 변경합니다.
    - 비회원 사용자: 발급된 일련번호를 입력해 명함을 관리합니다.
3. **랜덤 셔플**
    - 랜덤 셔플 버튼을 눌러 새로운 친구를 만나고, 필터링 옵션으로 원하는 조건을 설정할 수 있습니다.
4. **QR 코드 스캔**
    - 휴대폰 카메라 등을 이용하여 QR 코드를 스캔하여 명함 정보를 빠르게 확인할 수 있습니다.

## 화면 구성 📱

### 1. **홈 화면**

- QRU 소개 및 "명함 생성하기" 버튼.
- 로그인/회원 가입 버튼.

### 2. **명함 생성 화면**

- 사용자 정보 입력 폼.
- 미리보기 및 QR 코드 생성 버튼.

### 3. **랜덤 셔플 화면**

- 랜덤 셔플 시작 버튼.
- **필터링 옵션**: 성별, MBTI 등 조건 선택.

### 4. **QR 코드 관리 화면**

- QR 코드 미리보기 및 다운로드.
- 명함 정보 수정 및 정보 공개 설정 기능.

### 5. **로그인 및 회원가입 화면**

- Firebase Authentication을 통한 로그인 및 회원 가입.

## 반응형 웹 디자인 📐

QRU는 **모든 디바이스에서 원활히 동작**하도록 설계되었습니다.

- **모바일**: 간결한 UI와 터치 친화적인 디자인으로 누구나 쉽게 명함을 생성하고 관리할 수 있습니다.
- **태블릿**: 넓은 화면을 활용한 최적화된 사용자 경험 제공.
- **데스크톱**: 풍부한 UI와 빠른 데이터 접근 가능.

Tailwind CSS의 유연한 반응형 유틸리티 클래스를 사용하여 다양한 해상도에서도 일관된 디자인을 유지합니다.

---

## 기술 스택 🔧

### 프론트엔드 🖥️

- **React** (TypeScript)
- **Styled-components**: 간단하고 효율적인 UI 디자인
- **Axios**: API 통신 라이브러리

### 백엔드 및 인증 🛡️

- **Firebase Firestore**: 사용자 및 명함 데이터 관리
- **Firebase Authentication**: 회원 인증 및 세션 관리
- **Cloud Functions**: 서버리스 백엔드 로직 처리

### 기타 🚀

- **QR 코드 생성 라이브러리**: `qrcode.react`, `qr-code-styling`
- **LocalStorage**: 비회원 데이터 관리

## 데이터 구조 📂

### Firestore 데이터베이스 구조

Firestore 컬렉션 및 문서 기반의 구조를 활용하여 데이터를 관리합니다.

1. **users** (회원 정보)
    - `uid`: Firebase Authentication에서 제공하는 사용자 고유 ID
    - `email`: 사용자 이메일
    - `createdAt`: 가입 날짜
2. **cards** (명함 정보)
    - `id`: 문서 ID (자동 생성)
    - `uid`: 사용자의 고유 ID (비회원일 경우 NULL)
    - `serialNumber`: 비회원 랜덤 일련번호
    - `name`: 이름(닉네임)
    - `gender`: 성별
    - `phone`: 전화번호
    - `mbti`: MBTI
    - `hobby`: 취미
    - `sns`: SNS 아이디 리스트
    - `customFields`: 사용자 정의 필드 (최대 5개)
    - `qrCodeUrl`: 생성된 QR 코드 URL
    - `visibilitySettings`: 정보 공개 설정
        - `isShuffle`: 랜덤 셔플에서 비공개 여부
        - `visibleToWhom`: 특정 정보를 가진 사용자에게만 공개
    - `createdAt`: 생성 날짜
    - `updatedAt`: 수정 날짜

## 프로젝트 구조 📂

### 기본 프로젝트 구조

```bash
QRU/
├── public/                   # 정적 파일
│   └── logo.svg              # 로고 및 favicon
├── src/                      # 소스 코드
│   ├── assets/               # 이미지, 폰트, 아이콘 등
│   │   └── logo.svg
│   ├── components/           # 재사용 가능한 UI 컴포넌트
│   │   ├── common/           # 공통 컴포넌트 (버튼, 모달 등)
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── QRCode.tsx
│   │   ├── layout/           # 레이아웃 관련 컴포넌트
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   └── Logo.tsx
│   ├── contexts/             # Context API (전역 상태 관리)
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── QRCodeContext.tsx
│   ├── hooks/                # 커스텀 훅
│   │   └── useAuth.js
│   ├── pages/                # 라우트 페이지
│   │   ├── Home.tsx
│   │   ├── About.tsx
│   │   ├── MyPage.tsx
│   │   ├── QRShuffle.tsx
│   │   └── EditCard.tsx
│   ├── services/             # API 호출 로직
│   │   ├── firebase.js
│   │   └── api.js
│   ├── styles/               # 전역 스타일 및 테마 설정
│   │   ├── globals.css
│   │   └── tailwind.css
│   ├── App.tsx               # 주요 컴포넌트
│   ├── main.tsx              # 엔트리 포인트
│   └── vite-env.d.ts         # Vite 환경 변수 타입
├── .env                      # 환경 변수
├── package.json              # 패키지 정보
├── vite.config.js            # Vite 설정
└── README.md                 # 프로젝트 설명

```

### 세부 설명

1. **`public/`**
    - 정적 파일 저장소.
    - 로고, favicon, SEO 관련 메타파일 (e.g., robots.txt)을 저장.
2. **`src/components/`**
    - **`common/`**: 공통으로 사용하는 컴포넌트들 (e.g., 버튼, 모달, QR코드 생성).
    - **`layout/`**: 페이지 레이아웃 구성 요소 (e.g., 헤더, 푸터, 사이드바).
3. **`src/pages/`**
    - 주요 페이지 컴포넌트.
    - `Home.tsx`: 메인 랜딩 페이지.
    - `QRShuffle.tsx`: 랜덤 QR 셔플 기능 페이지.
    - `EditCard.tsx`: 명함 수정 페이지.
4. **`src/contexts/`**
    - **`AuthContext`**: 사용자 인증 상태 관리.
    - **`QRCodeContext`**: QR 코드 생성/관리 상태.
    - **`ThemeContext`**: 다크 모드 등 테마 설정.
5. **`src/services/`**
    - 서버와 통신하는 API 로직을 캡슐화.
    - `api.js`에서 Axios를 사용하여 호출을 통합 관리.
6. **`src/styles/`**
    - Tailwind CSS의 전역 스타일 정의 (`globals.css`).
    - 필요 시 커스텀 스타일 추가 (`tailwind.css`).
7. **`src/hooks/`**
    - 재사용 가능한 커스텀 훅 저장소.
    - e.g., `useAuth`, `useQRCode` 등.
8. **`App.tsx`**
    - 라우팅 및 전역 레이아웃 정의.
    - React Router를 사용하여 페이지 구성.
9. **환경 변수 설정 (`.env`)**
    - Firebase 설정 및 API URL 저장.

### 기본 의존성 패키지

1. **필수**
    
    ```bash
    npm install react-router-dom axios firebase
    
    ```
    
2. **Styled-components 설치**
    
    ```bash
    npm install styled-components
    npm install --save-dev @types/styled-components
    ```

    - TypeScript 프로젝트에서는 추가적으로 타입 정의를 설치해야 합니다.
    
3. **추가 유틸리티**
    - `react-icons`: 아이콘 사용.
    - `qrcode.react`: QR 코드 생성.
    - `clsx`: 조건부 클래스 관리. (선택)

## 개발 계획 🤸‍♀️

### 개발 일정 🗓️

| 기간 | 작업 내용 | 완료 |
| --- | --- | --- |
|  | 기획 및 화면 설계, 데이터베이스 설계 | ✅ |
|  | 프론트엔드 개발 (UI/UX 구성) |  |
|  | Firebase 연동 및 인증 로직 개발 | ✅ |
|  | 랜덤 셔플 기능 개발 |  |
|  | 정보 공개 설정 및 추가 기능 개발 |  |
|  | 버그 수정 및 최종 테스트 |  |
|  | 배포 및 사용자 피드백 |  |

### Commit Convention

| **타입 (Type)** | **설명** | **예시 커밋 메시지** |
| --- | --- | --- |
| `feat` | 새로운 기능 추가 | `feat: 회원가입 기능 추가` |
| `fix` | 버그 수정 | `fix: 로그인 실패 문제 해결` |
| `docs` | 문서 관련 변경 (README, 주석 등) | `docs: README에 실습 개요 추가` |
| `style` | 코드 스타일 변경 (공백, 세미콜론 등) | `style: 불필요한 줄바꿈 제거` |
| `design` | 기능 변경 없이 CSS 스타일 등의 UI/UX 변경 | `design: 전역 스타일(theme) 색상 변경` |
| `refactor` | 코드 리팩토링 (기능 변경 없음) | `refactor: 데이터 처리 로직 간소화` |
| `test` | 테스트 코드 추가 또는 수정 | `test: 회원가입 기능에 대한 유닛 테스트 추가` |
| `chore` | 설정 변경 및 기타 작업 | `chore: npm 패키지 업데이트` |
| `perf` | 성능 최적화 | `perf: 렌더링 속도 개선` |

## 팀원 및 역할 👥

### 김정현 🔗 [Hyeon](https://github.com/hyeoniverse)

- [Readme.md](http://readme.md/) 작성
- 기획
