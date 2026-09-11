const CACHE_NAME = "mini-game-hub-runtime-v2";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(
  Promise.all([
    self.clients.claim(),
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("mini-game-hub-runtime-") && key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  ])
));

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }))
  );
});
