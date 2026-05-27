/**
 * Service Worker mínimo para MiGlowUp.
 * - Habilita "Add to Home Screen" (PWA installable)
 * - Cachea assets básicos para arranque más rápido
 * - Recibe notificaciones push (cuando configuremos servidor de push)
 */

const CACHE_VERSION = "miglowup-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS_TO_CACHE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first para HTML/JSON, cache-first para imágenes/fonts
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isAsset = /\.(png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(url.pathname);
  if (isAsset) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => cached))
    );
    return;
  }

  // Para todo lo demás (HTML, API): network first
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

// Notificación push (servidor de push pendiente — la estructura ya está lista)
self.addEventListener("push", (event) => {
  const data = (() => {
    try { return event.data ? event.data.json() : {}; }
    catch { return { title: "MiGlowUp", body: event.data?.text() ?? "" }; }
  })();
  const title = data.title || "MiGlowUp 🌸";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: data.url || "/dashboard",
    vibrate: [100, 50, 100],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
