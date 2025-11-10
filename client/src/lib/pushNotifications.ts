/**
 * Push Notification Utilities
 * Helper functions for managing browser push notifications
 */

import { getPublicKey, subscribePushNotification, unsubscribePushNotification } from "./api/pushNotifications";
import type { PushSubscriptionData } from "./api/pushNotifications";

/**
 * Check if push notifications are supported in the browser
 */
export function isPushNotificationSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Check current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    throw new Error("Notifications are not supported in this browser");
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    throw new Error("Notification permission has been denied. Please enable it in your browser settings.");
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported in this browser");
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.log("[Push] Service worker registered:", registration.scope);

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log("[Push] Service worker ready");

    return registration;
  } catch (error: any) {
    console.error("[Push] Service worker registration failed:", error);
    throw new Error(`Failed to register service worker: ${error.message}`);
  }
}

/**
 * Convert VAPID public key from base64 URL-safe to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<PushSubscriptionData> {
  // Get VAPID public key from server
  const publicKey = await getPublicKey();

  // Convert public key to Uint8Array
  const applicationServerKey = urlBase64ToUint8Array(publicKey);

  // Subscribe to push notifications
  let subscription: PushSubscription | null = null;
  
  try {
    // Check if already subscribed
    subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log("[Push] Already subscribed to push notifications");
      // Verify subscription is still valid by checking if keys match
      const existingKeys = subscription.toJSON().keys;
      if (existingKeys) {
        return {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: existingKeys.p256dh || "",
            auth: existingKeys.auth || "",
          },
          userAgent: navigator.userAgent,
        };
      }
    }

    // Subscribe to push notifications
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as any, // Type assertion needed for compatibility
    });

    console.log("[Push] Subscribed to push notifications");

    // Get keys from subscription
    const p256dhKey = subscription.getKey("p256dh");
    const authKey = subscription.getKey("auth");

    if (!p256dhKey || !authKey) {
      throw new Error("Subscription keys are missing");
    }

    // Convert ArrayBuffer to base64 URL-safe string
    const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    };

    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(p256dhKey),
        auth: arrayBufferToBase64(authKey),
      },
      userAgent: navigator.userAgent,
    };

    return subscriptionData;
  } catch (error: any) {
    console.error("[Push] Failed to subscribe to push notifications:", error);
    throw new Error(`Failed to subscribe to push notifications: ${error.message}`);
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<void> {
  try {
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log("[Push] Unsubscribed from push notifications");
      
      // Also remove from server
      await unsubscribePushNotification(subscription.endpoint);
    }
  } catch (error: any) {
    console.error("[Push] Failed to unsubscribe from push notifications:", error);
    throw new Error(`Failed to unsubscribe: ${error.message}`);
  }
}

/**
 * Get current push subscription
 */
export async function getCurrentPushSubscription(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    return await registration.pushManager.getSubscription();
  } catch (error: any) {
    console.error("[Push] Failed to get push subscription:", error);
    return null;
  }
}

/**
 * Complete push notification setup
 * This function handles the entire flow: permission, registration, subscription, and server registration
 */
export async function setupPushNotifications(): Promise<PushSubscriptionData | null> {
  try {
    // Check if supported
    if (!isPushNotificationSupported()) {
      throw new Error("Push notifications are not supported in this browser");
    }

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      throw new Error(`Notification permission was ${permission}`);
    }

    // Register service worker
    const registration = await registerServiceWorker();

    // Subscribe to push notifications
    const subscriptionData = await subscribeToPushNotifications(registration);

    // Register subscription with server
    await subscribePushNotification(subscriptionData);

    console.log("[Push] Push notifications setup complete");
    return subscriptionData;
  } catch (error: any) {
    console.error("[Push] Failed to setup push notifications:", error);
    throw error;
  }
}

