// eslint-disable-next-line @typescript-eslint/no-unused-vars
self.addEventListener('install', (event) => {
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim())
})
