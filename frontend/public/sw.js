// Service worker TrashScan (PRD FR-27): aplikasi dapat dipasang dan model ter-cache.
const VERSI = "trashscan-v1";
const CACHE_BESAR = `${VERSI}-besar`; // model, WASM, aset ber-hash: cache-first
const CACHE_APP = `${VERSI}-app`; // html, konfigurasi, data: network-first

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => !k.startsWith(VERSI)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // tile peta dan Firebase tidak disentuh

  const besar = url.pathname.startsWith("/model/") || url.pathname.startsWith("/ort/") || url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/");
  if (besar) {
    e.respondWith(
      caches.open(CACHE_BESAR).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const salinan = res.clone();
          caches.open(CACHE_APP).then((c) => c.put(req.mode === "navigate" ? "/index.html" : req, salinan));
        }
        return res;
      })
      .catch(async () => {
        const c = await caches.open(CACHE_APP);
        return (await c.match(req.mode === "navigate" ? "/index.html" : req)) || Response.error();
      }),
  );
});
