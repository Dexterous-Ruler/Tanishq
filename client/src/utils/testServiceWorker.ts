/**
 * Utility functions to test service worker and push notifications
 * Run these in the browser console to debug
 */

export async function testServiceWorker() {
  console.log("🔍 Testing Service Worker...");
  
  // Check if service workers are supported
  if (!("serviceWorker" in navigator)) {
    console.error("❌ Service workers are not supported");
    return;
  }

  // Get service worker registration
  const registration = await navigator.serviceWorker.getRegistration();
  
  if (!registration) {
    console.error("❌ No service worker registered");
    return;
  }

  console.log("✅ Service worker registered");
  console.log("   Scope:", registration.scope);
  console.log("   Active:", registration.active?.state);
  console.log("   Installing:", registration.installing?.state);
  console.log("   Waiting:", registration.waiting?.state);

  // Check push manager
  if (!registration.pushManager) {
    console.error("❌ Push manager not available");
    return;
  }

  // Get subscription
  const subscription = await registration.pushManager.getSubscription();
  
  if (!subscription) {
    console.error("❌ No push subscription found");
    return;
  }

  console.log("✅ Push subscription found");
  console.log("   Endpoint:", subscription.endpoint.substring(0, 60) + "...");
  
  // Check notification permission
  const permission = Notification.permission;
  console.log("📱 Notification permission:", permission);
  
  if (permission !== "granted") {
    console.warn("⚠️  Notification permission is not granted");
    console.log("   Run: Notification.requestPermission()");
  }

  return {
    registration,
    subscription,
    permission,
  };
}

export async function testNotification() {
  console.log("🔔 Testing notification display...");
  
  const permission = Notification.permission;
  
  if (permission !== "granted") {
    console.error("❌ Notification permission not granted");
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  
  if (!registration) {
    console.error("❌ Service worker not registered");
    return;
  }

  try {
    await registration.showNotification("🧪 Test Notification", {
      body: "This is a test notification from the service worker",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "test",
      data: {
        type: "test",
        url: "/",
      },
    });
    
    console.log("✅ Test notification shown");
  } catch (error: any) {
    console.error("❌ Failed to show notification:", error);
  }
}

// Make functions available globally for console testing
if (typeof window !== "undefined") {
  (window as any).testServiceWorker = testServiceWorker;
  (window as any).testNotification = testNotification;
}

