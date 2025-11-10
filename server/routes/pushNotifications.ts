/**
 * Push Notification Routes
 * API endpoints for managing browser push notification subscriptions
 */

import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth";
import { pushNotificationService } from "../services/pushNotificationService";
import { config } from "../config";

const router = Router();

// Schema for push subscription
const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  userAgent: z.string().optional(),
});

// GET /api/push/public-key
// Get VAPID public key for frontend
router.get("/public-key", (req: Request, res: Response) => {
  const publicKey = config.push.publicKey;

  if (!publicKey) {
    return res.status(503).json({
      success: false,
      message: "Push notifications not configured",
    });
  }

  return res.json({
    success: true,
    publicKey,
  });
});

// POST /api/push/subscribe
// Register a push subscription
router.post(
  "/subscribe",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;

      // Validate subscription data
      const subscriptionData = pushSubscriptionSchema.parse(req.body);

      // Check if subscription already exists
      const existing = await storage.getPushSubscriptionByEndpoint(subscriptionData.endpoint);

      if (existing) {
        // Update existing subscription (user may have logged in from different device)
        if (existing.userId !== userId) {
          // Update to new user
          const updated = await storage.createPushSubscription({
            userId,
            endpoint: subscriptionData.endpoint,
            p256dh: subscriptionData.keys.p256dh,
            auth: subscriptionData.keys.auth,
            userAgent: subscriptionData.userAgent || req.get("user-agent") || null,
          });

          return res.json({
            success: true,
            message: "Push subscription updated",
            subscription: updated,
          });
        } else {
          // Same user, same subscription - no need to update
          return res.json({
            success: true,
            message: "Push subscription already exists",
            subscription: existing,
          });
        }
      }

      // Create new subscription
      const subscription = await storage.createPushSubscription({
        userId,
        endpoint: subscriptionData.endpoint,
        p256dh: subscriptionData.keys.p256dh,
        auth: subscriptionData.keys.auth,
        userAgent: subscriptionData.userAgent || req.get("user-agent") || null,
      });

      return res.json({
        success: true,
        message: "Push subscription registered",
        subscription,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription data",
          errors: error.errors,
        });
      }

      console.error("[Push] Error subscribing:", error);
      return next(error);
    }
  }
);

// DELETE /api/push/unsubscribe
// Remove a push subscription
router.delete(
  "/unsubscribe",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { endpoint } = req.body;

      if (!endpoint || typeof endpoint !== "string") {
        return res.status(400).json({
          success: false,
          message: "Endpoint is required",
        });
      }

      // Verify subscription belongs to user
      const subscription = await storage.getPushSubscriptionByEndpoint(endpoint);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found",
        });
      }

      if (subscription.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Delete subscription
      await storage.deletePushSubscription(subscription.id);

      return res.json({
        success: true,
        message: "Push subscription removed",
      });
    } catch (error: any) {
      console.error("[Push] Error unsubscribing:", error);
      return next(error);
    }
  }
);

// GET /api/push/subscriptions
// Get all push subscriptions for the current user
router.get(
  "/subscriptions",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;

      const subscriptions = await storage.getPushSubscriptions(userId);

      return res.json({
        success: true,
        subscriptions,
        count: subscriptions.length,
      });
    } catch (error: any) {
      console.error("[Push] Error getting subscriptions:", error);
      return next(error);
    }
  }
);

// POST /api/push/test
// Send a test notification (for testing purposes)
router.post(
  "/test",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;

      // Get user's subscriptions
      const subscriptions = await storage.getPushSubscriptions(userId);

      if (subscriptions.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No push subscriptions found",
        });
      }

      // Send test notification to first subscription
      const subscription = subscriptions[0];

      await pushNotificationService.sendNotification(subscription, {
        title: "Test Notification",
        body: "This is a test notification from Arogya Vault",
        icon: "/favicon.ico",
        data: {
          type: "test",
          url: "/",
        },
      });

      return res.json({
        success: true,
        message: "Test notification sent",
      });
    } catch (error: any) {
      console.error("[Push] Error sending test notification:", error);
      return next(error);
    }
  }
);

export default router;

