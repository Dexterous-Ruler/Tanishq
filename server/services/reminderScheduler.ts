/**
 * Reminder Scheduler
 * Background job scheduler for sending medication reminder emails and push notifications
 */

import * as cron from "node-cron";
import { storage } from "../storage";
import { emailService } from "./emailService";
import { pushNotificationService } from "./pushNotificationService";

export class ReminderScheduler {
  private task: cron.ScheduledTask | null = null;
  private isRunning = false;

  /**
   * Start the reminder scheduler
   * Runs every minute to check for due reminders
   */
  start(): void {
    if (this.isRunning) {
      console.warn("[Reminder Scheduler] Already running");
      return;
    }

    console.log("[Reminder Scheduler] Starting...");

    // Run every minute: * * * * *
    this.task = cron.schedule("* * * * *", async () => {
      await this.checkAndSendReminders();
    });

    this.isRunning = true;
    console.log("[Reminder Scheduler] Started successfully");
  }

  /**
   * Stop the reminder scheduler
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      this.isRunning = false;
      console.log("[Reminder Scheduler] Stopped");
    }
  }

  /**
   * Check for due reminders and send emails
   */
  private async checkAndSendReminders(): Promise<void> {
    try {
      const dueReminders = await storage.getDueReminders();

      if (dueReminders.length === 0) {
        return;
      }

      console.log(`[Reminder Scheduler] Found ${dueReminders.length} due reminder(s)`);

      for (const reminder of dueReminders) {
        try {
          // Get the medication
          const medication = await storage.getMedication(reminder.medicationId);
          
          if (!medication) {
            console.warn(`[Reminder Scheduler] Medication not found for reminder ${reminder.id}`);
            await storage.updateReminderStatus(reminder.id, 'skipped');
            continue;
          }

          // Check if medication is still active
          if (medication.status !== 'active') {
            console.log(`[Reminder Scheduler] Medication ${medication.id} is not active, skipping reminder`);
            await storage.updateReminderStatus(reminder.id, 'skipped');
            continue;
          }

          // Get user
          const user = await storage.getUser(medication.userId);
          
          if (!user) {
            console.warn(`[Reminder Scheduler] User not found for medication ${medication.id}`);
            await storage.updateReminderStatus(reminder.id, 'skipped');
            continue;
          }

          // Send email reminder (if user has email)
          if (user.email) {
            try {
              await emailService.sendMedicationReminder(user.email, medication);
              console.log(`[Reminder Scheduler] Sent email reminder for medication ${medication.name} to ${user.email}`);
            } catch (error: any) {
              console.error(`[Reminder Scheduler] Error sending email reminder:`, error.message);
              // Continue to send push notifications even if email fails
            }
          } else {
            console.warn(`[Reminder Scheduler] User email not found for medication ${medication.id}, skipping email`);
          }

          // Send push notifications to all user's devices/browsers
          try {
            const pushSubscriptions = await storage.getPushSubscriptions(medication.userId);
            
            if (pushSubscriptions.length > 0) {
              console.log(`[Reminder Scheduler] Sending push notifications to ${pushSubscriptions.length} device(s) for medication ${medication.name}`);
              
              // Send to all subscriptions (user may have multiple devices/browsers)
              const pushPromises = pushSubscriptions.map(async (subscription) => {
                try {
                  await pushNotificationService.sendMedicationReminder(subscription, medication);
                  console.log(`[Reminder Scheduler] Sent push notification to device: ${subscription.userAgent || 'unknown'}`);
                } catch (error: any) {
                  // Handle expired subscriptions
                  if (error.message === "Subscription expired" || error.message === "Invalid subscription") {
                    console.warn(`[Reminder Scheduler] Removing expired subscription: ${subscription.id}`);
                    await storage.deletePushSubscription(subscription.id);
                  } else {
                    console.error(`[Reminder Scheduler] Error sending push notification:`, error.message);
                  }
                }
              });

              // Wait for all push notifications to be sent (or fail)
              await Promise.allSettled(pushPromises);
            } else {
              console.log(`[Reminder Scheduler] No push subscriptions found for user ${medication.userId}`);
            }
          } catch (error: any) {
            console.error(`[Reminder Scheduler] Error sending push notifications:`, error.message);
            // Continue even if push notifications fail
          }
          
          // Update reminder status to 'sent'
          await storage.updateReminderStatus(reminder.id, 'sent');
          
          console.log(`[Reminder Scheduler] Completed reminder processing for medication ${medication.name}`);
        } catch (error: any) {
          console.error(`[Reminder Scheduler] Error processing reminder ${reminder.id}:`, error.message);
          // Don't mark as sent if there was an error - will retry on next run
        }
      }
    } catch (error: any) {
      console.error("[Reminder Scheduler] Error checking reminders:", error.message);
    }
  }
}

// Export singleton instance
export const reminderScheduler = new ReminderScheduler();

