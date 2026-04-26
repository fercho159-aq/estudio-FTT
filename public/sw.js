const VERSION = 'v3';
const STATIC_CACHE = `mnemo-static-${VERSION}`;
const RUNTIME_CACHE = `mnemo-runtime-${VERSION}`;
const PRECACHE = ['/', '/index.html', '/manifest.json', '/icon.svg', '/icon-maskable.svg'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== STATIC_CACHE && k !== RUNTIME_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(req).catch(() =>
        new Response(JSON.stringify({ error: 'Sin conexión' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then(c => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html').then(r => r || caches.match('/')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(cached => {
      const fetched = fetch(req).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
