const CACHE_NAME = 'faraz-code-editor-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/loader.js',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/editor/editor.main.css',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/editor/editor.main.js',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/editor/editor.main.nls.js',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/basic-languages/html/html.js',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/basic-languages/css/css.js',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/basic-languages/javascript/javascript.js',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/language/json/jsonMode.js',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/language/css/cssMode.js',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/language/html/htmlMode.js'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch Strategy: Network First, fallback to cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request);
      })
  );
});

// Handle messages
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});