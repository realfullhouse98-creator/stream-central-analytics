// Service Worker for 9kilos - Background Sync & Caching
const CACHE_NAME = '9kilos-v1';
const API_CACHE_NAME = '9kilos-api-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/tv-channels.json',
    '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('🔄 Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker activated');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - network first strategy for API, cache first for assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // API requests - network first, then cache
    if (url.pathname.includes('/api.php') || url.hostname === 'topembed.pw') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cache successful API responses
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(API_CACHE_NAME)
                            .then(cache => cache.put(event.request, responseClone));
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(event.request);
                })
        );
    } 
    // Static assets - cache first, then network
    else {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    // Return cached version or fetch new
                    return response || fetch(event.request);
                })
        );
    }
});

// Background sync for updates
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('🔄 Background sync triggered');
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        // Update matches data
        const response = await fetch('https://topembed.pw/api.php?format=json');
        if (response.ok) {
            const data = await response.json();
            const cache = await caches.open(API_CACHE_NAME);
            await cache.put('https://topembed.pw/api.php?format=json', new Response(JSON.stringify(data)));
            console.log('✅ Background sync completed');
            
            // Notify clients about update
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'UPDATE_AVAILABLE',
                    message: 'New sports data available'
                });
            });
        }
    } catch (error) {
        console.log('Background sync failed:', error);
    }
}

// Periodic background updates (every 30 minutes)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'periodic-background-sync') {
        console.log('🔄 Periodic background sync');
        event.waitUntil(doBackgroundSync());
    }
});
