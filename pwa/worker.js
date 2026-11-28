/* The Vite build supplies CACHE_NAME and PRECACHE before this script. */
const cachePrefix = "ijtaba-static-";
const staticPaths = new Set(PRECACHE);
const appRoute = /^\/(?:discover(?:\/prophetic|\/when-to-make-dua|\/ummah|\/uplifters|\/profiles(?:\/[^/]+)?)?|login|signup|forgot-password|auth\/callback|account(?:\/password)?|my-duas|calendar|tahajjud|about)?\/?$/;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      await cache.addAll(PRECACHE.map((url) => new Request(url, { cache: "reload" })));
      // A host may rewrite missing scripts to its HTML fallback during an upload.
      for (const path of PRECACHE.filter((url) => /\.(js|css)$/.test(url))) {
        const response = await cache.match(path);
        const type = response?.headers.get("Content-Type") ?? "";
        if (!type.includes(path.endsWith(".js") ? "javascript" : "text/css")) {
          throw new Error(`Invalid content type for ${path}: ${type}`);
        }
      }
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(cachePrefix) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function navigate(request, pathname) {
  const cache = await caches.open(CACHE_NAME);
  if (appRoute.test(pathname)) {
    // Keep the shell and its route chunks from the same release while tabs are open.
    const shell = await cache.match("/index.html");
    if (shell) return shell;
  }
  try {
    return await fetch(request);
  } catch {
    return (await cache.match("/offline.html")) || new Response("This page is unavailable offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin ||
      url.pathname === "/api" || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(navigate(request, url.pathname));
  } else if (!url.search && staticPaths.has(url.pathname)) {
    event.respondWith(caches.open(CACHE_NAME).then(async (cache) =>
      (await cache.match(request)) || fetch(request)));
  }
});
