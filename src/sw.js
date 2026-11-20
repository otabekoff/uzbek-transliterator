/* Service worker. The build fills in the version and the list of files to pre-cache. */
'use strict';

const CACHE = 'uzbek-transliterator-__VERSION__';
const PRECACHE = __PRECACHE__;

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE)
            .then(cache => cache.addAll(PRECACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k.startsWith('uzbek-transliterator-') && k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
        return;
    }

    // Pages: network first so updates show up straight away; the cached copy when offline.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE).then(cache => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => caches.match(request, { ignoreSearch: true })
                    .then(cached => cached || caches.match('./')))
        );
        return;
    }

    // Assets: from the cache (they are versioned with the cache), network as a fallback.
    event.respondWith(
        caches.match(request).then(cached => cached || fetch(request))
    );
});
