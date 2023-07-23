importScripts('/_nuxt/workbox.4c4f5ca6.js')

workbox.precaching.precacheAndRoute([
  {
    "url": "/_nuxt/7715ae1.js",
    "revision": "14c66ca5b324da27f3d4008580faf1d7"
  },
  {
    "url": "/_nuxt/852e878.js",
    "revision": "15e1028a227aca0e7932bfaba648838f"
  },
  {
    "url": "/_nuxt/8c82a02.js",
    "revision": "744d03381449003244d6a416a225c8f4"
  },
  {
    "url": "/_nuxt/d5af821.js",
    "revision": "c31a8cb5a42fa293258d0e43efed0226"
  },
  {
    "url": "/_nuxt/ec9b91f.js",
    "revision": "b39c57b474abc1089b5a2977cd60295e"
  },
  {
    "url": "/_nuxt/f14dc79.js",
    "revision": "2dc6f967c37e522b99470006487854ae"
  },
  {
    "url": "/_nuxt/ff39b8b.js",
    "revision": "af34826574c46daff7313be3bc490420"
  }
], {
  "cacheId": "unraidapi",
  "directoryIndex": "/",
  "cleanUrls": false
})

workbox.clientsClaim()
workbox.skipWaiting()

workbox.routing.registerRoute(new RegExp('/_nuxt/.*'), workbox.strategies.cacheFirst({}), 'GET')

workbox.routing.registerRoute(new RegExp('/.*'), workbox.strategies.networkFirst({}), 'GET')
