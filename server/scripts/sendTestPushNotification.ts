/**
 * Send Test Push Notification
 * Script to send a test push notification to a user's subscription
 * 
 * Usage:
 *   npx tsx server/scripts/sendTestPushNotification.ts [userId]
 * 
 * If userId is not provided, it will send to the first subscription found
 */

import "dotenv/config";
import { storage } from "../storage";
import { pushNotificationService } from "../services/pushNotificationService";

async function sendTestPushNotification() {
  const userId = process.argv[2]; // Get userId from command line argument

  try {
    console.log("🔔 Sending test push notification...");
    console.log("");

    let subscriptions;

    if (userId) {
      console.log(`📱 Looking for subscriptions for user: ${userId}`);
      subscriptions = await storage.getPushSubscriptions(userId);
    } else {
      console.log("📱 Looking for all push subscriptions...");
      // Get all subscriptions (we'll need to query all users or use a different approach)
      // For now, let's get subscriptions for the first user we can find
      const allSubscriptions: any[] = [];
      
      // Since we don't have a direct method to get all subscriptions,
      // we'll need to query the database directly or get a user first
      // For testing, let's try to get a user and their subscriptions
      console.log("⚠️  No userId provided. Please provide a userId as argument.");
      console.log("   Usage: npx tsx server/scripts/sendTestPushNotification.ts <userId>");
      process.exit(1);
    }

    if (subscriptions.length === 0) {
      console.log("❌ No push subscriptions found for this user.");
      console.log("");
      console.log("💡 To subscribe to push notifications:");
      console.log("   1. Open the app in Chrome: http://localhost:3000");
      console.log("   2. Log in to your account");
      console.log("   3. Go to Profile Settings");
      console.log("   4. Enable Browser Notifications");
      console.log("   5. Grant permission when prompted");
      process.exit(1);
    }

    console.log(`✅ Found ${subscriptions.length} subscription(s)`);
    console.log("");

    // Send test notification to the first subscription
    const subscription = subscriptions[0];
    console.log(`📤 Sending test notification to:`);
    console.log(`   Endpoint: ${subscription.endpoint.substring(0, 60)}...`);
    console.log(`   User Agent: ${subscription.userAgent || "Unknown"}`);
    console.log("");

    await pushNotificationService.sendNotification(subscription, {
      title: "🧪 Test Notification",
      body: "This is a test push notification from Arogya Vault! If you see this, push notifications are working correctly.",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: {
        type: "test",
        url: "/",
        timestamp: new Date().toISOString(),
      },
      tag: "test-notification",
      requireInteraction: false,
    });

    console.log("✅ Test push notification sent successfully!");
    console.log("");
    console.log("📱 Check your browser - you should see a notification!");
    console.log("   (Make sure the browser is open or the service worker is active)");
  } catch (error: any) {
    console.error("❌ Failed to send test push notification:", error.message);
    console.error("");
    
    if (error.message.includes("Subscription expired") || error.message.includes("Invalid subscription")) {
      console.log("💡 The subscription may have expired. Please:");
      console.log("   1. Go to Profile Settings");
      console.log("   2. Disable and re-enable Browser Notifications");
      console.log("   3. Grant permission again");
    }
    
    process.exit(1);
  }
}

sendTestPushNotification();

