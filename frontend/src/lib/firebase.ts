import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, signInAnonymously, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

const env = import.meta.env;

/** false bila .env belum diisi: aplikasi inti (scan, kamus, peta) tetap jalan. */
export const firebaseSiap = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_APP_ID);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (firebaseSiap) {
  app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
  });
  if (env.VITE_APPCHECK_SITE_KEY) {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(env.VITE_APPCHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  }
  auth = getAuth(app);
  db = getFirestore(app);
}

export const getApp = () => app;
export const getDb = () => db;

let uidPromise: Promise<string | null> | null = null;
export let galatAuth: string | null = null;

/** Anonymous Auth, dipanggil lazy (saat kuis atau feedback pertama kali). */
export function ensureUid(): Promise<string | null> {
  if (!auth) return Promise.resolve(null);
  if (!uidPromise) {
    uidPromise = (async () => {
      try {
        if (auth!.currentUser) return auth!.currentUser.uid;
        const cred = await signInAnonymously(auth!);
        return cred.user.uid;
      } catch (e) {
        console.warn("Anonymous Auth gagal:", e);
        galatAuth = (e as { code?: string })?.code ?? String(e);
        uidPromise = null;
        return null;
      }
    })();
  }
  return uidPromise;
}
