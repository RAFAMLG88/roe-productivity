// ROE Productivity — service worker
// Estratégia: network-first (busca sempre a versão nova; se falhar, usa a cache).
// Assim nunca ficas preso a uma versão antiga depois de um deploy no Vercel.

const CACHE = 'roe-productivity-v1'
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './favicon.svg', './icon-192.png', './icon-512.png']

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL).catch(() => {})))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  // a cidade 3D é grande (~5MB): deixa o browser tratar dela normalmente
  if (req.url.includes('cidade-v41.html')) return
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
        return res
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  )
})
