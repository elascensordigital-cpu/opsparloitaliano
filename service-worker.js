
'use strict';

const CACHE_NAME = 'ops-parlo-italiano-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json'
];

const OPTIONAL_ICONS = [
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await cache.addAll(APP_SHELL);

    await Promise.allSettled(
      OPTIONAL_ICONS.map(url => cache.add(url))
    );

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          key.startsWith('ops-parlo-italiano-') &&
          key !== CACHE_NAME
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (
    url.origin !== self.location.origin ||
    !url.pathname.startsWith(
      new URL(self.registration.scope).pathname
    )
  ) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);

        if (fresh.ok) {
          (await caches.open(CACHE_NAME))
            .put('./index.html', fresh.clone());
        }

        return fresh;
      } catch {
        return (
          (await caches.match('./index.html')) ||
          Response.error()
        );
      }
    })());

    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);

    if (cached) return cached;

    const response = await fetch(request);

    if (response.ok) {
      (await caches.open(CACHE_NAME))
        .put(request, response.clone());
    }

    return response;
  })());
});
