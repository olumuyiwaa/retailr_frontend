// Receives push messages from the Retailr API and shows them as system notifications.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { /* not JSON: show a generic message */ }
  const title = data.title || "Retailr";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/images/logo/mark.svg",
      badge: "/images/logo/mark.svg",
      tag: data.type || "retailr",
      data: { link: data.link || "/admin" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.link) || "/admin", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const w of windows) {
        if (new URL(w.url).origin === self.location.origin && "focus" in w) {
          return w.focus().then((f) => ("navigate" in f ? f.navigate(target) : undefined));
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
