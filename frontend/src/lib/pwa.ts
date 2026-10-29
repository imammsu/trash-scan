import { useEffect, useState } from "react";

interface PromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let tertunda: PromptEvent | null = null;
const pendengar = new Set<() => void>();

export function daftarkanSW() {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  tertunda = e as PromptEvent;
  pendengar.forEach((f) => f());
});
window.addEventListener("appinstalled", () => {
  tertunda = null;
  pendengar.forEach((f) => f());
});

/** Tombol "Pasang aplikasi" hanya muncul bila browser menawarkannya. */
export function usePasang() {
  const [bisa, setBisa] = useState(tertunda !== null);
  useEffect(() => {
    const f = () => setBisa(tertunda !== null);
    pendengar.add(f);
    return () => void pendengar.delete(f);
  }, []);
  return {
    bisa,
    async pasang() {
      if (!tertunda) return;
      await tertunda.prompt();
      await tertunda.userChoice;
      tertunda = null;
      pendengar.forEach((f) => f());
    },
  };
}
