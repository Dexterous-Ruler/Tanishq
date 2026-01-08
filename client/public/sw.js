/**
 * Service Worker for Push Notifications
 * Handles push events and displays browser notifications
 */

const CACHE_NAME = "arogya-vault-v1";
const APP_URL = "/";

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  
  // Cache essential assets for offline support
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching essential assets");
      return cache.addAll([
        "/",
        "/icon-192.png",
        "/icon-512.png",
        "/manifest.json",
      ]).catch((err) => {
        console.warn("[Service Worker] Some assets failed to cache:", err);
      });
    })
  );
  
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      return self.clients.claim(); // Take control of all pages
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip API requests and external resources
  if (
    event.request.url.includes("/api/") ||
    event.request.url.startsWith("http") && !event.request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached version if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response for caching
        const responseToCache = response.clone();

        // Cache the response
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // If fetch fails and it's a navigation request, return a fallback
        if (event.request.mode === "navigate") {
          return caches.match("/") || new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({ "Content-Type": "text/html" }),
          });
        }
      });
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push event received", event);

  let notificationData = {
    title: "Arogya Vault",
    body: "You have a new notification",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: {},
    tag: "default",
    requireInteraction: false,
  };

  // Parse push notification data
  if (event.data) {
    try {
      // Try to parse as JSON first
      const data = event.data.json();
      console.log("[Service Worker] Parsed push data:", data);
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: data.data || notificationData.data,
        tag: data.tag || notificationData.tag,
        requireInteraction: data.requireInteraction || notificationData.requireInteraction,
        actions: data.actions || [],
      };
    } catch (error) {
      console.error("[Service Worker] Error parsing push data as JSON:", error);
      // Try to get text data
      try {
        const textData = event.data.text();
        console.log("[Service Worker] Push data as text:", textData);
        // Try to parse text as JSON
        const parsed = JSON.parse(textData);
        notificationData = {
          title: parsed.title || notificationData.title,
          body: parsed.body || notificationData.body,
          icon: parsed.icon || notificationData.icon,
          badge: parsed.badge || notificationData.badge,
          data: parsed.data || notificationData.data,
          tag: parsed.tag || notificationData.tag,
          requireInteraction: parsed.requireInteraction || notificationData.requireInteraction,
          actions: parsed.actions || [],
        };
      } catch (textError) {
        console.error("[Service Worker] Error parsing push data as text:", textError);
        // Use text as body if all parsing fails
        notificationData.body = event.data.text() || notificationData.body;
      }
    }
  } else {
    console.warn("[Service Worker] Push event has no data");
  }

  console.log("[Service Worker] Showing notification with data:", notificationData);

  // Mobile-optimized notification options
  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction,
    actions: notificationData.actions,
    vibrate: [200, 100, 200], // Vibration pattern for mobile devices
    timestamp: Date.now(),
    // Mobile-specific optimizations
    silent: false, // Ensure sound plays on mobile
    renotify: true, // Re-notify if tag matches (for mobile notification bar)
    dir: "ltr", // Text direction
    lang: "en", // Language
  };

  // Show notification
  const notificationPromise = self.registration.showNotification(notificationData.title, notificationOptions);

  event.waitUntil(
    notificationPromise.then(() => {
      console.log("[Service Worker] Notification shown successfully");
    }).catch((error) => {
      console.error("[Service Worker] Error showing notification:", error);
    })
  );
});

// Notification click event - handle user clicking on notification
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked", event.notification.data);

  event.notification.close(); // Close the notification

  // Determine URL to open
  let urlToOpen = APP_URL;
  if (event.notification.data && event.notification.data.url) {
    urlToOpen = event.notification.data.url;
  } else if (event.notification.data && event.notification.data.type === "medication_reminder") {
    urlToOpen = "/medications";
  }

  // Handle action buttons
  if (event.action === "view") {
    urlToOpen = event.notification.data?.url || "/medications";
  }

  // Open or focus the app
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus().then(() => {
              // Navigate to the URL if needed
              if (client.url !== urlToOpen) {
                return client.navigate(urlToOpen);
              }
            });
          }
        }
        // If app is not open, open it in a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event - handle user dismissing notification
self.addEventListener("notificationclose", (event) => {
  console.log("[Service Worker] Notification closed", event.notification.data);
  // Could send analytics here if needed
});

// Message event - handle messages from the main app
self.addEventListener("message", (event) => {
  console.log("[Service Worker] Message received:", event.data);
  
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

