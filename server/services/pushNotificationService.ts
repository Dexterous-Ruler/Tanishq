/**
 * Push Notification Service
 * Handles sending browser push notifications using Web Push API
 */

import webpush from "web-push";
import { config } from "../config";
import { type PushSubscription, type Medication } from "@shared/schema";

export interface IPushNotificationService {
  sendMedicationReminder(subscription: PushSubscription, medication: Medication): Promise<void>;
  sendNotification(subscription: PushSubscription, payload: PushNotificationPayload): Promise<void>;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export class WebPushNotificationService implements IPushNotificationService {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const publicKey = config.push.publicKey;
    const privateKey = config.push.privateKey;
    const subject = config.push.subject;

    if (!publicKey || !privateKey) {
      console.warn("⚠️  VAPID keys not configured, push notifications will not work");
      return;
    }

    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.initialized = true;
      console.log("✅ Push notification service initialized");
      console.log(`   VAPID Subject: ${subject}`);
      console.log(`   VAPID Public Key: ${publicKey.substring(0, 20)}...`);
    } catch (error: any) {
      console.error("❌ Failed to initialize push notification service:", error.message);
    }
  }

  async sendNotification(
    subscription: PushSubscription,
    payload: PushNotificationPayload
  ): Promise<void> {
    if (!this.initialized) {
      console.warn("[Push] Service not initialized, skipping notification");
      return;
    }

    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || "/favicon.ico",
        badge: payload.badge || "/favicon.ico",
        data: payload.data || {},
        tag: payload.tag,
        requireInteraction: payload.requireInteraction || false,
        actions: payload.actions || [],
      });

      await webpush.sendNotification(pushSubscription, notificationPayload);

      console.log(`✅ Push notification sent to ${subscription.endpoint.substring(0, 50)}...`);
    } catch (error: any) {
      // Handle specific error cases
      if (error.statusCode === 410) {
        // Subscription expired or no longer valid
        console.warn(`[Push] Subscription expired: ${subscription.endpoint.substring(0, 50)}...`);
        throw new Error("Subscription expired");
      } else if (error.statusCode === 404 || error.statusCode === 403) {
        // Subscription not found or invalid
        console.warn(`[Push] Invalid subscription: ${subscription.endpoint.substring(0, 50)}...`);
        throw new Error("Invalid subscription");
      } else {
        console.error(`[Push] Failed to send notification:`, error.message);
        throw error;
      }
    }
  }

  async sendMedicationReminder(
    subscription: PushSubscription,
    medication: Medication
  ): Promise<void> {
    // Parse timing array
    let timingArray: string[] = [];
    try {
      timingArray = JSON.parse(medication.timing);
    } catch {
      timingArray = [medication.timing];
    }

    // Format timing display
    const timingDisplay = timingArray.length > 0
      ? timingArray
          .map((t) => {
            const [hours, minutes] = t.split(":");
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? "PM" : "AM";
            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
            return `${displayHour}:${minutes || "00"} ${ampm}`;
          })
          .join(", ")
      : "as prescribed";

    // Build notification body
    let body = `${medication.name} - ${medication.dosage}`;
    if (medication.instructions) {
      body += `\n${medication.instructions}`;
    }

    const payload: PushNotificationPayload = {
      title: "💊 Time to take your medication",
      body: body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: {
        type: "medication_reminder",
        medicationId: medication.id,
        medicationName: medication.name,
        url: "/medications",
      },
      tag: `medication-${medication.id}`, // Use tag to replace previous notifications for same medication
      requireInteraction: false, // Allow auto-dismiss
      actions: [
        {
          action: "view",
          title: "View Medications",
        },
      ],
    };

    await this.sendNotification(subscription, payload);
  }
}

export class MockPushNotificationService implements IPushNotificationService {
  async sendNotification(
    subscription: PushSubscription,
    payload: PushNotificationPayload
  ): Promise<void> {
    console.log("[Push Mock] Would send notification:", payload.title);
    console.log(`  To: ${subscription.endpoint.substring(0, 50)}...`);
    console.log(`  Body: ${payload.body}`);
  }

  async sendMedicationReminder(
    subscription: PushSubscription,
    medication: Medication
  ): Promise<void> {
    console.log("[Push Mock] Medication reminder for", medication.name);
    console.log(`  To: ${subscription.endpoint.substring(0, 50)}...`);
  }
}

export function createPushNotificationService(): IPushNotificationService {
  const publicKey = config.push.publicKey;
  const privateKey = config.push.privateKey;

  if (publicKey && privateKey) {
    try {
      return new WebPushNotificationService();
    } catch (error: any) {
      console.warn("⚠️  Failed to create push notification service, using mock:", error.message);
      return new MockPushNotificationService();
    }
  }

  console.log("ℹ️  No VAPID keys configured, using mock push notification service");
  return new MockPushNotificationService();
}

// Export singleton instance
export const pushNotificationService = createPushNotificationService();

