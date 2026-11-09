const CACHE_NAME = 'pwa-ej5-shell-v1';
const API_CACHE = 'pwa-ej5-api-v1';
const SHELL = ['./', './index.html', './style.css', './app.js'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('pwa-ej5-') && ![CACHE_NAME, API_CACHE].includes(key)).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      try {
        const response = await fetch(request);
        if (response.ok) (await caches.open(CACHE_NAME)).put(request, response.clone());
        return response;
      } catch {
        return cached || new Response('Página no disponible sin conexión.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }
  if (url.hostname === 'jsonplaceholder.typicode.com' && url.pathname.startsWith('/posts')) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) (await caches.open(API_CACHE)).put(request, response.clone());
        return response;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(JSON.stringify({ error: 'offline', message: 'No hay respuesta en caché.' }), {
          status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
    })());
  }
});
