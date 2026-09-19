import { FirebaseApp, initializeApp } from "firebase/app";
import { Analytics, getAnalytics, isSupported } from "firebase/analytics";
import { Auth, getAuth, GoogleAuthProvider } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/** 이 값들이 비어 있으면 Firebase SDK 를 초기화할 수 없다. */
const REQUIRED_CONFIG_KEYS = [
  "apiKey",
  "authDomain",
  "projectId",
  "appId",
] as const;

const toEnvName = (key: string) =>
  `VITE_FIREBASE_${key.replace(/[A-Z]/g, (char) => `_${char}`).toUpperCase()}`;

/** 채워지지 않은 설정 항목을 .env 변수 이름으로 돌려준다. */
export const missingFirebaseConfig: string[] = REQUIRED_CONFIG_KEYS.filter(
  (key) => !firebaseConfig[key]
).map(toEnvName);

export const isFirebaseConfigured = missingFirebaseConfig.length === 0;

export class FirebaseNotConfiguredError extends Error {
  constructor() {
    super("Firebase 설정이 없어 이 기능을 사용할 수 없습니다.");
    this.name = "FirebaseNotConfiguredError";
  }
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

// provider 는 SDK 초기화와 무관한 설정 객체라 언제든 만들 수 있다.
const provider = new GoogleAuthProvider();

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    /**
     * Analytics 는 프로젝트에 Google Analytics 를 연결했을 때만 쓸 수 있다.
     * measurementId 가 있고 지원하는 환경일 때만 초기화한다.
     */
    if (firebaseConfig.measurementId) {
      const initialized = app;
      void isSupported()
        .then((supported) => {
          if (supported) analytics = getAnalytics(initialized);
        })
        .catch(() => {
          // 지원하지 않는 환경에서는 Analytics 없이 동작한다.
        });
    }
  } catch (error) {
    // 설정값 형식이 잘못된 경우까지 여기서 잡아 앱 전체가 멈추지 않게 한다.
    console.error("[firebase] 초기화에 실패했습니다.", error);
    app = null;
    auth = null;
    db = null;
  }
} else {
  console.warn(
    `[firebase] 설정이 없어 초기화를 건너뜁니다. .env 에서 비어 있는 값: ${missingFirebaseConfig.join(", ")}`
  );
}

/** Firebase 가 필요한 동작에서 쓴다. 설정이 없으면 분명한 오류를 던진다. */
export const requireAuth = (): Auth => {
  if (!auth) throw new FirebaseNotConfiguredError();
  return auth;
};

export const requireDb = (): Firestore => {
  if (!db) throw new FirebaseNotConfiguredError();
  return db;
};

export { app, analytics, auth, provider, db };
