// CricScore Service Worker — PR-1: PWA
const CACHE_NAME = 'cricscore-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/teams',
  '/match/create',
  '/offline',
  '/manifest.json',
];

// ── Install: cache static shell ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for assets ──────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: network only, no caching
  if (url.pathname.startsWith('/auth') ||
      url.pathname.startsWith('/teams') ||
      url.pathname.startsWith('/matches') ||
      url.pathname.startsWith('/score') ||
      url.pathname.startsWith('/players')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'Offline — no network' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503,
        })
      )
    );
    return;
  }

  // Next.js static assets: cache-first
  if (url.pathname.startsWith('/_next/static')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        return res;
      }))
    );
    return;
  }

  // Pages: network-first, fall back to cache, then offline page
  event.respondWith(
    fetch(request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        return res;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match('/offline'))
      )
  );
});

// ── Push notifications (used by PR-3) ─────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'CricScore', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: data.tag || 'cricscore',
      data: { url: data.url || '/dashboard' },
      actions: data.actions || [],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((wins) => {
      const existing = wins.find((w) => w.url.includes(target));
      if (existing) return existing.focus();
      return clients.openWindow(target);
    })
  );
});
