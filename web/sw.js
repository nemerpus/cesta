// Network-first con caché de respaldo: la app funciona sin conexión.
const CACHE = 'cesta-v4';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest', './icon.svg', './fonts.css',
  './fonts/dm-sans.woff2', './fonts/fraunces.woff2', './fonts/jetbrains-mono.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
