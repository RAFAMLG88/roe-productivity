// ROE Productivity — service worker
// index/app: network-first (nunca ficas preso a versão antiga após deploy)
// cidade 3D (5MB): stale-while-revalidate (abre instantâneo da cache; atualiza em fundo)

const CACHE = 'roe-productivity-v31'
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

  // CIDADE 3D: stale-while-revalidate — instantânea a partir da 2ª visita
  if (req.url.includes('cidade-v41.html')) {
    e.respondWith(
      caches.match(req).then((cached) => {
        const refetch = fetch(req).then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
          return res
        }).catch(() => cached)
        return cached || refetch
      })
    )
    return
  }

  // resto: network-first
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
