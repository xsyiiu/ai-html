/* 抽词复习 · Service Worker（离线缓存） */
const VER = "ci-2.0";
const CORE = ["./", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(VER)
      .then(c => c.addAll(CORE).catch(() => { }))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const isData = /\/(index\.html)?$/.test(url.pathname) || url.pathname.endsWith(".json");

  if (isData) {
    // 页面和词表：先网后缓存，保证拿得到最新版
    e.respondWith(
      fetch(req)
        .then(r => {
          const cp = r.clone();
          caches.open(VER).then(c => c.put(req, cp));
          return r;
        })
        .catch(() => caches.match(req).then(m => m || caches.match("./")))
    );
  } else {
    // 图标、manifest 等：先缓存
    e.respondWith(
      caches.match(req).then(m => m || fetch(req).then(r => {
        const cp = r.clone();
        caches.open(VER).then(c => c.put(req, cp));
        return r;
      }).catch(() => m))
    );
  }
});
