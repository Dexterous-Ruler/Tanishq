/**
 * Send Test Email
 * Quick script to send a test email to verify SMTP is working
 */

import "dotenv/config";
import { emailService } from "../services/emailService";
import { type Medication } from "@shared/schema";

async function sendTestEmail() {
  const testEmail = "dexterous471@gmail.com";

  console.log("📧 Sending test email to:", testEmail);
  console.log("");

  // Create a mock medication for testing
  const testMedication: Medication = {
    id: "test-medication-id",
    userId: "test-user-id",
    name: "Test Medication - Paracetamol",
    dosage: "500mg",
    frequency: "twice daily",
    timing: JSON.stringify(["08:00", "20:00"]),
    startDate: new Date(),
    endDate: null,
    source: "manual",
    sourceDocumentId: null,
    status: "active",
    instructions: "Take with water after meals",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    await emailService.sendMedicationReminder(testEmail, testMedication);
    console.log("");
    console.log("✅ Test email sent successfully!");
    console.log(`   Please check the inbox for: ${testEmail}`);
    console.log("   Also check spam/junk folder if not found in inbox");
  } catch (error: any) {
    console.error("");
    console.error("❌ Failed to send test email:", error.message);
    console.error("");
    process.exit(1);
  }
}

sendTestEmail().catch(console.error);

