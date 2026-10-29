// Status ringan di perangkat (localStorage). Semua dibungkus try/catch (mode privat bisa menolak).

function get(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function set(key: string, val: string) {
  try {
    localStorage.setItem(key, val);
  } catch {
    /* abaikan */
  }
}

export const src = (() => {
  const dariUrl = new URLSearchParams(location.search).get("src");
  if (dariUrl) {
    try {
      sessionStorage.setItem("ts_src", dariUrl.slice(0, 40));
    } catch {
      /* abaikan */
    }
  }
  try {
    return sessionStorage.getItem("ts_src") || "direct";
  } catch {
    return dariUrl?.slice(0, 40) || "direct";
  }
})();

export const jumlahScan = () => Number(get("ts_scan") || 0);
export const tambahScan = () => set("ts_scan", String(jumlahScan() + 1));

export const noticeSudahDilihat = () => get("ts_notice") === "1";
export const tandaiNotice = () => set("ts_notice", "1");

export type TipeKuis = "pre" | "post";
export const kuisSelesai = (t: TipeKuis) => get(`ts_${t}`) !== null;
export const tandaiKuisSelesai = (t: TipeKuis, skor: number, total: number) =>
  set(`ts_${t}`, JSON.stringify({ skor, total, at: Date.now() }));
export const infoKuis = (t: TipeKuis): { skor: number; total: number; at: number } | null => {
  const v = get(`ts_${t}`);
  try {
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};

export const urutanSet = (uid: string | null): "AB" | "BA" => {
  const tersimpan = get("ts_order");
  if (tersimpan === "AB" || tersimpan === "BA") return tersimpan;
  const acak = uid ? [...uid].reduce((a, c) => a + c.charCodeAt(0), 0) % 2 === 0 : Math.random() < 0.5;
  const o = acak ? "AB" : "BA";
  set("ts_order", o);
  return o;
};

export const feedbackTerkirim = (id: string) => get(`ts_fb_${id}`) === "1";
export const tandaiFeedback = (id: string) => set(`ts_fb_${id}`, "1");
