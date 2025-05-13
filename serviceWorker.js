importScripts("/workbox-sw.js");

workbox.setConfig({ debug: false });

const {
    routing: { registerRoute, setCatchHandler },
    strategies: { CacheFirst, NetworkFirst, StaleWhileRevalidate },
    cacheableResponse: { CacheableResponse, CacheableResponsePlugin },
    expiration: { ExpirationPlugin, CacheExpiration },
    precaching: { matchPrecache, precacheAndRoute },
} = workbox;

precacheAndRoute([{ url: "/offline.html", revision: null }]);

// Cache page navigations (html) with a Network First strategy
registerRoute(
    ({ request }) => request.mode === "navigate",
    new NetworkFirst({
        cacheName: "pages",
        plugins: [
            new CacheableResponsePlugin({
                statuses: [200],
            }),
        ],
    })
);


// Cache Images
registerRoute(
    ({ request }) => request.destination === "image",
    new CacheFirst({
        cacheName: "pwa-images",
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 60,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 365 Days
            }),
        ],
    })
);

// Cache CSS, JS, Manifest, and Web Worker
registerRoute(
    ({ request }) =>
        request.destination === "script" ||
        request.destination === "style" ||
        request.destination === "manifest" ||
        request.destination === "worker",
    new StaleWhileRevalidate({
        cacheName: "pwa-static-assets",
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 32,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 365 Days
            }),
        ],
    })
);

// Catch routing errors, like if the user is offline
setCatchHandler(async ({ event }) => {
    // Return the precached offline page if a document is being requested
    if (event.request.destination === "document") {
        return matchPrecache("/offline.html");
    }

    return Response.error();
});

