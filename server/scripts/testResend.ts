/**
 * Test Resend Email Service
 * Script to verify Resend API integration and domain configuration
 */

import "dotenv/config";
import { Resend } from "resend";

async function testResend() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "noreply@arogyavault.me";
  const fromName = process.env.EMAIL_FROM_NAME || "Arogya Vault";
  const testEmail = process.env.TEST_EMAIL || "test@example.com";

  if (!apiKey) {
    console.error("❌ RESEND_API_KEY not set in environment variables");
    process.exit(1);
  }

  console.log("🔧 Testing Resend Email Service...");
  console.log(`   API Key: ${apiKey.substring(0, 10)}...`);
  console.log(`   From Email: ${fromEmail}`);
  console.log(`   From Name: ${fromName}`);
  console.log(`   Test Email: ${testEmail}`);
  console.log("");

  try {
    const resend = new Resend(apiKey);

    // Test 1: List domains
    console.log("📋 Test 1: Listing domains...");
    try {
      const domains = await resend.domains.list();
      console.log("✅ Domains retrieved successfully");
      if (domains.data && domains.data.length > 0) {
        console.log(`   Found ${domains.data.length} domain(s):`);
        domains.data.forEach((domain: any) => {
          console.log(`   - ${domain.name} (${domain.status})`);
          if (domain.name === "arogyavault.me") {
            console.log(`     ✓ Domain found and status: ${domain.status}`);
          }
        });
      } else {
        console.warn("   ⚠️  No domains found");
      }
    } catch (error: any) {
      console.error("❌ Failed to list domains:", error.message);
    }
    console.log("");

    // Test 2: Verify domain
    console.log("🔍 Test 2: Verifying domain arogavault.me...");
    try {
      const domains = await resend.domains.list();
      const domain = domains.data?.find((d: any) => d.name === "arogyavault.me");
      if (domain) {
        const verifyResult = await resend.domains.verify(domain.id);
        console.log("✅ Domain verification check completed");
        console.log(`   Domain ID: ${domain.id}`);
        console.log(`   Status: ${verifyResult.data?.status || domain.status}`);
      } else {
        console.warn("   ⚠️  Domain arogavault.me not found in account");
      }
    } catch (error: any) {
      console.error("❌ Failed to verify domain:", error.message);
    }
    console.log("");

    // Test 3: Send test email
    console.log("📧 Test 3: Sending test email...");
    try {
      const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: testEmail,
        subject: "Test Email from Arogya Vault",
        html: `
          <h1>Test Email</h1>
          <p>This is a test email from Arogya Vault to verify Resend integration.</p>
          <p><strong>From:</strong> ${fromEmail}</p>
          <p><strong>Domain:</strong> arogavault.me</p>
          <p>If you receive this email, the Resend integration is working correctly!</p>
        `,
        text: `Test Email\n\nThis is a test email from Arogya Vault to verify Resend integration.\n\nFrom: ${fromEmail}\nDomain: arogavault.me\n\nIf you receive this email, the Resend integration is working correctly!`,
      });

      if (error) {
        console.error("❌ Failed to send test email:", JSON.stringify(error, null, 2));
      } else {
        console.log("✅ Test email sent successfully!");
        console.log(`   Email ID: ${data?.id}`);
        console.log(`   To: ${testEmail}`);
        console.log(`   From: ${fromEmail}`);
      }
    } catch (error: any) {
      console.error("❌ Failed to send test email:", error.message);
      if (error.message.includes("domain")) {
        console.error("   💡 Tip: Make sure the domain is verified in Resend dashboard");
      }
    }
    console.log("");

    console.log("✅ Resend integration test completed!");
  } catch (error: any) {
    console.error("❌ Failed to initialize Resend:", error.message);
    process.exit(1);
  }
}

testResend().catch(console.error);

