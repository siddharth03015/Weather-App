// Service Worker for Weather Now PWA
const CACHE_NAME = 'weather-now-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './assets/images/logo.svg',
  './assets/images/favicon-32x32.png',
  './assets/images/icon-search.svg',
  './assets/images/icon-units.svg',
  './assets/images/icon-dropdown.svg',
  './assets/images/icon-checkmark.svg',
  './assets/images/icon-loading.svg',
  './assets/images/icon-error.svg',
  './assets/images/icon-retry.svg',
  './assets/images/bg-today-large.svg',
  './assets/images/icon-sunny.webp',
  './assets/images/icon-partly-cloudy.webp',
  './assets/images/icon-overcast.webp',
  './assets/images/icon-fog.webp',
  './assets/images/icon-drizzle.webp',
  './assets/images/icon-rain.webp',
  './assets/images/icon-snow.webp',
  './assets/images/icon-storm.webp',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API calls, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first for API calls
  if (url.hostname.includes('open-meteo.com') || url.hostname.includes('openstreetmap.org')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
