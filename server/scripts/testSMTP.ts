/**
 * Test SMTP Email Service
 * Script to verify SMTP connection and send a test email
 */

import "dotenv/config";
import nodemailer from "nodemailer";

async function testSMTP() {
  const smtpConfig = {
    host: process.env.SMTP_HOST || "smtp.resend.com",
    port: parseInt(process.env.SMTP_PORT || "465", 10),
    secure: process.env.SMTP_SECURE !== "false", // true for 465
    auth: {
      user: process.env.SMTP_USERNAME || "resend",
      pass: process.env.SMTP_PASSWORD || "",
    },
  };

  const fromEmail = process.env.EMAIL_FROM || "team@arogyavault.me";
  const fromName = process.env.EMAIL_FROM_NAME || "Arogya Vault";
  const testEmail = process.env.TEST_EMAIL || "test@example.com";

  console.log("🔧 Testing SMTP Email Service...");
  console.log(`   Host: ${smtpConfig.host}`);
  console.log(`   Port: ${smtpConfig.port}`);
  console.log(`   Secure: ${smtpConfig.secure}`);
  console.log(`   Username: ${smtpConfig.auth.user}`);
  console.log(`   From Email: ${fromEmail}`);
  console.log(`   From Name: ${fromName}`);
  console.log(`   Test Email: ${testEmail}`);
  console.log("");

  if (!smtpConfig.auth.pass) {
    console.error("❌ SMTP_PASSWORD not set in environment variables");
    process.exit(1);
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport(smtpConfig);

    // Test 1: Verify SMTP connection
    console.log("📋 Test 1: Verifying SMTP connection...");
    try {
      await transporter.verify();
      console.log("✅ SMTP connection verified successfully!");
    } catch (error: any) {
      console.error("❌ SMTP connection verification failed:", error.message);
      if (error.code === "EAUTH") {
        console.error("   💡 Tip: Check your SMTP username and password");
      } else if (error.code === "ECONNECTION") {
        console.error("   💡 Tip: Check your SMTP host and port");
      }
      process.exit(1);
    }
    console.log("");

    // Test 2: Send test email
    console.log("📧 Test 2: Sending test email...");
    try {
      const info = await transporter.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to: testEmail,
        subject: "Test Email from Arogya Vault (SMTP)",
        html: `
          <h1>Test Email</h1>
          <p>This is a test email from Arogya Vault to verify SMTP integration.</p>
          <p><strong>From:</strong> ${fromEmail}</p>
          <p><strong>SMTP Host:</strong> ${smtpConfig.host}</p>
          <p>If you receive this email, the SMTP integration is working correctly!</p>
        `,
        text: `Test Email\n\nThis is a test email from Arogya Vault to verify SMTP integration.\n\nFrom: ${fromEmail}\nSMTP Host: ${smtpConfig.host}\n\nIf you receive this email, the SMTP integration is working correctly!`,
      });

      console.log("✅ Test email sent successfully!");
      console.log(`   Message ID: ${info.messageId}`);
      console.log(`   To: ${testEmail}`);
      console.log(`   From: ${fromEmail}`);
      console.log(`   Response: ${info.response}`);
    } catch (error: any) {
      console.error("❌ Failed to send test email:", error.message);
      if (error.responseCode === 550) {
        console.error("   💡 Tip: Check if the sender email is verified in Resend");
      }
      process.exit(1);
    }
    console.log("");

    console.log("✅ SMTP integration test completed successfully!");
  } catch (error: any) {
    console.error("❌ Failed to initialize SMTP:", error.message);
    process.exit(1);
  }
}

testSMTP().catch(console.error);

