/**
 * Push Notification Diagnostic Script
 * Run this in the browser console to diagnose push notification issues
 */

async function diagnosePushNotifications() {
  console.log("🔍 Push Notification Diagnostic");
  console.log("=".repeat(50));
  
  // 1. Check browser support
  console.log("\n1. Browser Support:");
  const hasServiceWorker = "serviceWorker" in navigator;
  const hasPushManager = "PushManager" in window;
  const hasNotification = "Notification" in window;
  console.log(`   Service Worker: ${hasServiceWorker ? "✅" : "❌"}`);
  console.log(`   Push Manager: ${hasPushManager ? "✅" : "❌"}`);
  console.log(`   Notification API: ${hasNotification ? "✅" : "❌"}`);
  
  if (!hasServiceWorker || !hasPushManager || !hasNotification) {
    console.error("❌ Push notifications are not supported in this browser");
    return;
  }
  
  // 2. Check notification permission
  console.log("\n2. Notification Permission:");
  const permission = Notification.permission;
  console.log(`   Permission: ${permission}`);
  if (permission !== "granted") {
    console.warn(`   ⚠️  Permission is "${permission}". Request permission to enable notifications.`);
  }
  
  // 3. Check service worker registration
  console.log("\n3. Service Worker:");
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      console.log(`   ✅ Registered: ${registration.scope}`);
      console.log(`   Active: ${registration.active ? registration.active.state : "none"}`);
      console.log(`   Installing: ${registration.installing ? registration.installing.state : "none"}`);
      console.log(`   Waiting: ${registration.waiting ? registration.waiting.state : "none"}`);
      
      // 4. Check push subscription
      console.log("\n4. Push Subscription:");
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        console.log(`   ✅ Subscribed`);
        console.log(`   Endpoint: ${subscription.endpoint.substring(0, 50)}...`);
        const keys = subscription.toJSON().keys;
        if (keys) {
          console.log(`   p256dh: ${keys.p256dh ? "Set" : "Missing"}`);
          console.log(`   auth: ${keys.auth ? "Set" : "Missing"}`);
        }
      } else {
        console.warn(`   ⚠️  Not subscribed. Enable notifications in Profile Settings.`);
      }
    } else {
      console.error("   ❌ Service worker not registered");
      console.log("   Try refreshing the page or enabling notifications in Profile Settings");
    }
  } catch (error) {
    console.error("   ❌ Error checking service worker:", error);
  }
  
  // 5. Check VAPID public key from server
  console.log("\n5. Server Configuration:");
  try {
    const response = await fetch("/api/push/public-key");
    const data = await response.json();
    if (data.success && data.publicKey) {
      console.log(`   ✅ VAPID Public Key: ${data.publicKey.substring(0, 20)}...`);
    } else {
      console.error("   ❌ VAPID keys not configured on server");
    }
  } catch (error) {
    console.error("   ❌ Error fetching public key:", error);
  }
  
  // 6. Check subscriptions from server
  console.log("\n6. Server Subscriptions:");
  try {
    const response = await fetch("/api/push/subscriptions", {
      credentials: "include"
    });
    const data = await response.json();
    if (data.success) {
      console.log(`   Subscriptions: ${data.count || 0}`);
      if (data.subscriptions && data.subscriptions.length > 0) {
        data.subscriptions.forEach((sub, i) => {
          console.log(`   ${i + 1}. ${sub.endpoint.substring(0, 50)}...`);
        });
      } else {
        console.warn("   ⚠️  No subscriptions found on server");
      }
    }
  } catch (error) {
    console.error("   ❌ Error fetching subscriptions:", error);
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("Diagnostic complete!");
}

// Run diagnostic
diagnosePushNotifications();

