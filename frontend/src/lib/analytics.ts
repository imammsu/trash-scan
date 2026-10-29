import { getAnalytics, isSupported, logEvent, type Analytics } from "firebase/analytics";
import { getApp } from "./firebase";

let analytics: Analytics | null = null;
const siap: Promise<void> = (async () => {
  const app = getApp();
  if (!app) return;
  try {
    if (await isSupported()) analytics = getAnalytics(app);
  } catch {
    /* analitik opsional */
  }
})();

/** Kejadian anonim (PRD 11.1). Jangan pernah mengirim data pribadi. */
export function track(name: string, params: Record<string, string | number> = {}) {
  void siap.then(() => {
    if (analytics) logEvent(analytics, name, params);
  });
}
