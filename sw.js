const CACHE = "qr-wallet-v1";
const CDN = [
  "https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"
];
const LOCAL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(LOCAL);
    await Promise.all(CDN.map(async u => {
      try { await c.put(u, await fetch(u, { mode: "no-cors" })); } catch (_) {}
    }));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith((async () => {
    const hit = await caches.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(e.request);
      if (res && (res.ok || res.type === "opaque")) {
        const c = await caches.open(CACHE);
        c.put(e.request, res.clone());
      }
      return res;
    } catch (_) {
      return e.request.mode === "navigate" ? caches.match("./index.html") : Response.error();
    }
  })());
});
