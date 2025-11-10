/**
 * Email Service
 * Handles sending medication reminder emails using Resend API or SMTP
 */

import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { type Medication } from "@shared/schema";
import { config } from "../config";

export interface IEmailService {
  sendMedicationReminder(email: string, medication: Medication): Promise<void>;
}

export class SMTPEmailService implements IEmailService {
  private transporter: Transporter | null = null;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.fromEmail = config.email.from;
    this.fromName = config.email.fromName;

    const smtpConfig = config.email.smtp;

    if (smtpConfig.password) {
      try {
        this.transporter = nodemailer.createTransport({
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.secure, // true for 465, false for other ports
          auth: {
            user: smtpConfig.username,
            pass: smtpConfig.password,
          },
        });

        // Verify SMTP connection
        this.transporter.verify((error, success) => {
          if (error) {
            console.error("❌ SMTP connection verification failed:", error.message);
          } else {
            console.log("✅ SMTP connection verified successfully");
          }
        });

        console.log("✅ SMTP email service initialized");
        console.log(`   Host: ${smtpConfig.host}`);
        console.log(`   Port: ${smtpConfig.port}`);
        console.log(`   Secure: ${smtpConfig.secure}`);
        console.log(`   Username: ${smtpConfig.username}`);
        console.log(`   From Email: ${this.fromEmail}`);
        console.log(`   From Name: ${this.fromName}`);
      } catch (error: any) {
        console.error("❌ Failed to initialize SMTP:", error.message);
      }
    } else {
      console.warn("⚠️  SMTP_PASSWORD not set, email service will log only");
    }
  }

  async sendMedicationReminder(email: string, medication: Medication): Promise<void> {
    if (!this.transporter) {
      console.log(`[Email Mock] Would send medication reminder to ${email} for ${medication.name}`);
      return;
    }

    if (!email || !email.includes('@')) {
      console.warn(`[Email] Invalid email address: ${email}`);
      return;
    }

    try {
      // Parse timing array
      let timingArray: string[] = [];
      try {
        timingArray = JSON.parse(medication.timing);
      } catch {
        timingArray = [medication.timing];
      }

      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });

      const html = this.getMedicationReminderHTML(medication, currentTime);
      const text = this.getMedicationReminderText(medication, currentTime);

      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: `💊 Time to take your medication: ${medication.name}`,
        html,
        text,
      };

      console.log(`[Email] Sending medication reminder to ${email} from ${this.fromEmail} via SMTP`);

      const info = await this.transporter.sendMail(mailOptions);

      console.log(`✅ Medication reminder email sent to ${email} for ${medication.name} (Message ID: ${info.messageId})`);
    } catch (error: any) {
      console.error(`❌ Failed to send medication reminder email to ${email}:`, error.message);
      throw error;
    }
  }

  private getMedicationReminderHTML(medication: Medication, currentTime: string): string {
    let timingArray: string[] = [];
    try {
      timingArray = JSON.parse(medication.timing);
    } catch {
      timingArray = [medication.timing];
    }

    const timingDisplay = timingArray.length > 0 
      ? timingArray.map(t => {
          const [hours, minutes] = t.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
          return `${displayHour}:${minutes || '00'} ${ampm}`;
        }).join(', ')
      : 'as prescribed';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Medication Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">💊 Medication Reminder</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      It's time to take your medication:
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
      <h2 style="color: #667eea; margin-top: 0; font-size: 20px;">${medication.name}</h2>
      <p style="margin: 10px 0;"><strong>Dosage:</strong> ${medication.dosage}</p>
      <p style="margin: 10px 0;"><strong>Frequency:</strong> ${medication.frequency}</p>
      <p style="margin: 10px 0;"><strong>Time:</strong> ${timingDisplay}</p>
      ${medication.instructions ? `<p style="margin: 10px 0;"><strong>Instructions:</strong> ${medication.instructions}</p>` : ''}
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Current time: ${currentTime}
    </p>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      <p style="font-size: 12px; color: #999; margin: 0;">
        This is an automated reminder from Arogya Vault. Please consult your healthcare provider for medical advice.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private getMedicationReminderText(medication: Medication, currentTime: string): string {
    let timingArray: string[] = [];
    try {
      timingArray = JSON.parse(medication.timing);
    } catch {
      timingArray = [medication.timing];
    }

    const timingDisplay = timingArray.length > 0 
      ? timingArray.map(t => {
          const [hours, minutes] = t.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
          return `${displayHour}:${minutes || '00'} ${ampm}`;
        }).join(', ')
      : 'as prescribed';

    return `
Medication Reminder

It's time to take your medication:

${medication.name}
Dosage: ${medication.dosage}
Frequency: ${medication.frequency}
Time: ${timingDisplay}
${medication.instructions ? `Instructions: ${medication.instructions}` : ''}

Current time: ${currentTime}

This is an automated reminder from Arogya Vault. Please consult your healthcare provider for medical advice.
    `.trim();
  }
}

export class ResendEmailService implements IEmailService {
  private resend: Resend | null = null;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = config.email.from;
    this.fromName = config.email.fromName;

    if (apiKey) {
      try {
        this.resend = new Resend(apiKey);
        console.log("✅ Resend email service initialized (API)");
        console.log(`   From Email: ${this.fromEmail}`);
        console.log(`   From Name: ${this.fromName}`);
        console.log(`   API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
      } catch (error: any) {
        console.error("❌ Failed to initialize Resend:", error.message);
      }
    } else {
      console.warn("⚠️  RESEND_API_KEY not set, email service will log only");
    }
  }

  async sendMedicationReminder(email: string, medication: Medication): Promise<void> {
    if (!this.resend) {
      console.log(`[Email Mock] Would send medication reminder to ${email} for ${medication.name}`);
      return;
    }

    if (!email || !email.includes('@')) {
      console.warn(`[Email] Invalid email address: ${email}`);
      return;
    }

    try {
      // Parse timing array
      let timingArray: string[] = [];
      try {
        timingArray = JSON.parse(medication.timing);
      } catch {
        timingArray = [medication.timing];
      }

      const nextTime = timingArray[0] || "now";
      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });

      const html = this.getMedicationReminderHTML(medication, currentTime);
      const text = this.getMedicationReminderText(medication, currentTime);

      const emailPayload = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: `💊 Time to take your medication: ${medication.name}`,
        html,
        text,
      };

      console.log(`[Email] Sending medication reminder to ${email} from ${this.fromEmail}`);

      const { data, error } = await this.resend.emails.send(emailPayload);

      if (error) {
        console.error(`[Email] Resend API error:`, JSON.stringify(error, null, 2));
        throw new Error(`Resend API error: ${JSON.stringify(error)}`);
      }

      console.log(`✅ Medication reminder email sent to ${email} for ${medication.name} (ID: ${data?.id})`);
    } catch (error: any) {
      console.error(`❌ Failed to send medication reminder email to ${email}:`, error.message);
      throw error;
    }
  }

  private getMedicationReminderHTML(medication: Medication, currentTime: string): string {
    let timingArray: string[] = [];
    try {
      timingArray = JSON.parse(medication.timing);
    } catch {
      timingArray = [medication.timing];
    }

    const timingDisplay = timingArray.length > 0 
      ? timingArray.map(t => {
          const [hours, minutes] = t.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
          return `${displayHour}:${minutes || '00'} ${ampm}`;
        }).join(', ')
      : 'as prescribed';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Medication Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">💊 Medication Reminder</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      It's time to take your medication:
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
      <h2 style="color: #667eea; margin-top: 0; font-size: 20px;">${medication.name}</h2>
      <p style="margin: 10px 0;"><strong>Dosage:</strong> ${medication.dosage}</p>
      <p style="margin: 10px 0;"><strong>Frequency:</strong> ${medication.frequency}</p>
      <p style="margin: 10px 0;"><strong>Time:</strong> ${timingDisplay}</p>
      ${medication.instructions ? `<p style="margin: 10px 0;"><strong>Instructions:</strong> ${medication.instructions}</p>` : ''}
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Current time: ${currentTime}
    </p>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      <p style="font-size: 12px; color: #999; margin: 0;">
        This is an automated reminder from Arogya Vault. Please consult your healthcare provider for medical advice.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private getMedicationReminderText(medication: Medication, currentTime: string): string {
    let timingArray: string[] = [];
    try {
      timingArray = JSON.parse(medication.timing);
    } catch {
      timingArray = [medication.timing];
    }

    const timingDisplay = timingArray.length > 0 
      ? timingArray.map(t => {
          const [hours, minutes] = t.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
          return `${displayHour}:${minutes || '00'} ${ampm}`;
        }).join(', ')
      : 'as prescribed';

    return `
Medication Reminder

It's time to take your medication:

${medication.name}
Dosage: ${medication.dosage}
Frequency: ${medication.frequency}
Time: ${timingDisplay}
${medication.instructions ? `Instructions: ${medication.instructions}` : ''}

Current time: ${currentTime}

This is an automated reminder from Arogya Vault. Please consult your healthcare provider for medical advice.
    `.trim();
  }
}

export class MockEmailService implements IEmailService {
  async sendMedicationReminder(email: string, medication: Medication): Promise<void> {
    console.log(`[Email Mock] Medication reminder for ${medication.name}`);
    console.log(`  To: ${email}`);
    console.log(`  Dosage: ${medication.dosage}`);
    console.log(`  Frequency: ${medication.frequency}`);
    console.log(`  Timing: ${medication.timing}`);
    if (medication.instructions) {
      console.log(`  Instructions: ${medication.instructions}`);
    }
  }
}

export function createEmailService(): IEmailService {
  const provider = config.email.provider;

  if (provider === "smtp") {
    const smtpPassword = config.email.smtp.password;
    if (smtpPassword) {
      try {
        return new SMTPEmailService();
      } catch (error: any) {
        console.warn("⚠️  Failed to create SMTP email service, using mock:", error.message);
        return new MockEmailService();
      }
    } else {
      console.warn("⚠️  SMTP_PASSWORD not set, using mock email service");
      return new MockEmailService();
    }
  } else if (provider === "resend") {
    const apiKey = config.email.resend.apiKey;
    if (apiKey) {
      try {
        return new ResendEmailService();
      } catch (error: any) {
        console.warn("⚠️  Failed to create Resend email service, using mock:", error.message);
        return new MockEmailService();
      }
    } else {
      console.warn("⚠️  RESEND_API_KEY not set, using mock email service");
      return new MockEmailService();
    }
  }
  
  console.log("ℹ️  Using mock email service");
  return new MockEmailService();
}

// Export singleton instance
export const emailService = createEmailService();

