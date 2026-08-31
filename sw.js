/* Offline-Cache. Nach jeder Aenderung an index.html die Zahl hochzaehlen. */
const CACHE = 'lager-v4';
const SHELL = ['./', 'index.html', 'config.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Anfragen an Supabase nie zwischenspeichern
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; })
      .catch(() => caches.match(req).then(hit => hit || caches.match('index.html')))
  );
});
