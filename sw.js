// Keeps a copy of the app files on the phone so it opens faster and survives weak networks.
// It never touches database traffic. Updated files appear the second time the app is opened.
const V = "hub-v2";
const SHELL = ["./", "index.html", "firebase-config.js", "logo.svg", "manifest.json", "icon-192.png"];
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).catch(() => {}));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;
  if (!(u.origin === location.origin || u.hostname === "www.gstatic.com")) return;
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(r);
    const net = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => null);
    if (hit) return hit;
    return (await net) || Response.error();
  }));
});
