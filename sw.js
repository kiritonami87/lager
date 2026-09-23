/* Offline-Cache. Nach jeder Aenderung an index.html die Zahl hochzaehlen. */
const CACHE = 'lager-v16';
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
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; })
      .catch(() => caches.match(req).then(hit => hit || caches.match('index.html')))
  );
});

/* ---- Benachrichtigung empfangen ----
   Der Text kommt verschluesselt vom Server. Falls etwas nicht stimmt,
   zeigen wir bewusst nur eine neutrale Meldung. */
self.addEventListener('push', e => {
  let d = { title: 'Lager', body: 'Es gibt etwas Neues.', tag: 'lager' };
  try { if (e.data) d = Object.assign(d, e.data.json()); } catch (err) { }
  e.waitUntil(self.registration.showNotification(String(d.title).slice(0, 80), {
    body: String(d.body).slice(0, 160),
    tag: String(d.tag || 'lager'),
    renotify: true,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    data: { url: './' }
  }));
});

/* ---- Antippen oeffnet die App statt eines neuen Fensters ---- */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const liste = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of liste) {
      if (c.url.includes(self.registration.scope) && 'focus' in c) return c.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow('./');
  })());
});
