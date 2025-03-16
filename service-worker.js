/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'pwa-test-v1';
const urlsToCache = [
  '/pwa-test/',
  '/pwa-test/index.html',
  '/pwa-test/static/js/main.*.js',
  '/pwa-test/static/css/main.*.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
