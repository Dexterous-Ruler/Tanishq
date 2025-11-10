/**
 * Generate VAPID Keys for Web Push Notifications
 * 
 * VAPID (Voluntary Application Server Identification) keys are used to
 * identify your application server when sending push notifications.
 * 
 * Run this script to generate keys:
 *   npx tsx server/scripts/generateVAPIDKeys.ts
 */

import webpush from "web-push";

console.log("🔑 Generating VAPID keys for Web Push Notifications...");
console.log("");

try {
  const vapidKeys = webpush.generateVAPIDKeys();

  console.log("✅ VAPID keys generated successfully!");
  console.log("");
  console.log("Add these to your .env file:");
  console.log("");
  console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  console.log("");
  console.log("⚠️  IMPORTANT:");
  console.log("   - Keep the private key secret (never commit to git)");
  console.log("   - The public key can be exposed to the frontend");
  console.log("   - These keys are used to authenticate push notifications");
  console.log("");
} catch (error: any) {
  console.error("❌ Failed to generate VAPID keys:", error.message);
  process.exit(1);
}

