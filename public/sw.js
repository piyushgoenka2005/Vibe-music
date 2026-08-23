/* Vibe Music PWA shell service worker — network-first for pages, cache-first for static assets. */
const CACHE_NAME = "vibe-shell-v3";
const PRECACHE_URLS = [
  "/site.webmanifest",
  "/icon-48.png",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-icon.png",
];

function isPrivatePath(pathname) {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/orders/")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isPrivatePath(url.pathname)) {
    return;
  }

  const isNavigation = request.mode === "navigate";
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".webmanifest") ||
    /\.(?:png|jpg|jpeg|webp|avif|svg|ico|woff2?)$/i.test(url.pathname);

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});

/* ===================== Web push (Phase 9) ===================== */
self.addEventListener("push", (event) => {
  let payload = { title: "Vibe Music", body: "", url: "/" };
  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = {
        title: typeof parsed.title === "string" ? parsed.title : payload.title,
        body: typeof parsed.body === "string" ? parsed.body : "",
        url: typeof parsed.url === "string" ? parsed.url : "/",
        tag: typeof parsed.tag === "string" ? parsed.tag : undefined,
      };
    }
  } catch {
    /* keep defaults on malformed payloads */
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/icon-48.png",
      tag: payload.tag,
      data: { url: payload.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target =
    (event.notification.data && event.notification.data.url) || "/";
  const absolute = new URL(target, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(absolute).catch(() => undefined);
          return client.focus();
        }
      }
      return self.clients.openWindow(absolute);
    })
  );
});
