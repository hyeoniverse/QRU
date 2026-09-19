import { initializeApp } from "firebase/app";
import { Analytics, getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

/**
 * Analytics 는 프로젝트에 Google Analytics 를 연결했을 때만 쓸 수 있다.
 * measurementId 없이 getAnalytics 를 부르면 앱 시작 자체가 실패하므로,
 * 설정이 있을 때만 그리고 지원하는 환경에서만 초기화한다.
 */
let analytics: Analytics | null = null;

if (firebaseConfig.measurementId) {
  void isSupported()
    .then((supported) => {
      if (supported) analytics = getAnalytics(app);
    })
    .catch(() => {
      // 지원하지 않는 환경에서는 Analytics 없이 동작한다.
    });
}

export { app, analytics, auth, provider, db };
