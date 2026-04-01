var CACHE_NAME = 'habits-v1';
var URLS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './data/habits.json'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (name) { return name !== CACHE_NAME; })
          .map(function (name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      // Network-first for the data file (in case habits are updated)
      if (event.request.url.indexOf('habits.json') !== -1) {
        return fetch(event.request).then(function (response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, clone); });
          return response;
        }).catch(function () { return cached; });
      }
      // Cache-first for everything else
      return cached || fetch(event.request);
    })
  );
});
