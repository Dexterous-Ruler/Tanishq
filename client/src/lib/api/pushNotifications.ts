/**
 * Push Notification API Client
 * Functions for interacting with push notification API endpoints
 */

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
}

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicKeyResponse {
  success: boolean;
  publicKey?: string;
  message?: string;
}

export interface SubscribeResponse {
  success: boolean;
  message: string;
  subscription?: PushSubscription;
}

export interface SubscriptionsResponse {
  success: boolean;
  subscriptions: PushSubscription[];
  count: number;
}

/**
 * Get VAPID public key from server
 */
export async function getPublicKey(): Promise<string> {
  const res = await fetch("/api/push/public-key", {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to get public key" }));
    throw new Error(error.message || "Failed to get public key");
  }

  const data: PublicKeyResponse = await res.json();
  if (!data.success || !data.publicKey) {
    throw new Error(data.message || "Public key not available");
  }

  return data.publicKey;
}

/**
 * Subscribe to push notifications
 */
export async function subscribePushNotification(
  subscription: PushSubscriptionData
): Promise<PushSubscription> {
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(subscription),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to subscribe" }));
    throw new Error(error.message || "Failed to subscribe to push notifications");
  }

  const data: SubscribeResponse = await res.json();
  if (!data.success || !data.subscription) {
    throw new Error(data.message || "Failed to subscribe");
  }

  return data.subscription;
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribePushNotification(endpoint: string): Promise<void> {
  const res = await fetch("/api/push/unsubscribe", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ endpoint }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to unsubscribe" }));
    throw new Error(error.message || "Failed to unsubscribe from push notifications");
  }
}

/**
 * Get all push subscriptions for the current user
 */
export async function getPushSubscriptions(): Promise<PushSubscription[]> {
  const res = await fetch("/api/push/subscriptions", {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to get subscriptions" }));
    throw new Error(error.message || "Failed to get push subscriptions");
  }

  const data: SubscriptionsResponse = await res.json();
  return data.subscriptions || [];
}

/**
 * Send a test notification
 */
export async function sendTestNotification(): Promise<void> {
  const res = await fetch("/api/push/test", {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to send test notification" }));
    throw new Error(error.message || "Failed to send test notification");
  }
}

