"use strict"

// Cache Name
const cache_name = "static-cache-v1"
// Cache Files
const files_to_cache = [
    "/",
    "/index.html",
    "/manifest.json",
    "/favicon.png",
    "/global.css",
    "/build/bundle.css",
    "/sounds/beat-wood-high.mp3",
    "/sounds/beat-wood.mp3",
    "/sounds/clap.mp3",
    "/sounds/djembe-base.mp3",
    "/sounds/djembe-slap.mp3",
    "/sounds/djembe-tone.mp3",
    "/sounds/dundunba.mp3",
    "/sounds/kenkeni.mp3",
    "/sounds/sangban-closed.mp3",
    "/sounds/sangban.mp3",
    "/sounds/shake.mp3",
    "/font/GoodTimes.otf",
    "/font/Skranji-Regular.ttf",
    "/build/bundle.js"
]

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(cache_name).then((cache) => cache.addAll(files_to_cache))
    )
    self.skipWaiting()
})


self.addEventListener("activate", (event) => {
    event.waitUntil(caches.keys().then(
        (keys) => Promise.all(
            keys.filter((key) => key !== cache_name)
                .map((key) => caches.delete(key))
        ))
    )
    event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", (event) => {
    const {request} = event

    function update_cache(request, response) {
        if (response.ok) cache.put(request, response)
        console.log("[SW] update_cache", request, response)
        return response
    }

    event.respondWith(
        Promise.any([
            fetch(request).then((response) => update_cache(request, response)),
            caches.open(cache_name).then((cache) => cache.match(request))
        ])
    )
})
