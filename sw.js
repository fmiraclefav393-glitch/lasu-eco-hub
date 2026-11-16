// Keeps a copy of the app on the phone for weak networks.
// It always tries the internet first (so you get the newest version), and falls back to the saved copy.
// It never touches database traffic.
const V = "hub-v3";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;
  const same = u.origin === location.origin, lib = u.hostname === "www.gstatic.com";
  if (!same && !lib) return;
  e.respondWith((async () => {
    const c = await caches.open(V);
    if (lib) { // Firebase library files never change for a given version: use the saved copy first
      const hit = await c.match(r);
      if (hit) return hit;
      try { const res = await fetch(r); if (res.ok) c.put(r, res.clone()); return res; } catch (x) { return Response.error(); }
    }
    try { // our own files: internet first (wait up to 3.5 seconds), then the saved copy
      const res = await Promise.race([fetch(r), new Promise((_, rej) => setTimeout(rej, 3500))]);
      if (res.ok) c.put(r, res.clone());
      return res;
    } catch (x) {
      const hit = await c.match(r);
      return hit || Response.error();
    }
  })());
});
