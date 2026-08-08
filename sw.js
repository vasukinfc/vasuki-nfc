const CACHE = "vasuki-smart-v13-fast";
const ASSETS = [
  "./", "./index.html", "./login.html", "./customer.html", "./owner.html",
  "./styles.css", "./smart-card.css", "./shared.js", "./firebase-config.js",
  "./public-card.js", "./customer.js", "./owner.js", "./manifest.webmanifest",
  "./owner-manifest.webmanifest", "./icon.svg"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("activate", event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const target = new URL(request.url);
  if (target.origin !== self.location.origin || target.pathname.includes("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request, { cache: "no-store" }).catch(() => caches.match(request).then(hit => hit || caches.match("./index.html"))));
    return;
  }

  event.respondWith(caches.match(request).then(hit => {
    const fresh = fetch(request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
      return response;
    });
    return hit || fresh;
  }));
});
