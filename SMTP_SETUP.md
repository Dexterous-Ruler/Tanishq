# SMTP Email Configuration Guide

## Overview
The email service now supports SMTP configuration for Supabase's integrated Resend SMTP service. This allows you to send medication reminder emails through Supabase's SMTP settings.

## Configuration

### Step 1: Get SMTP Credentials

For Resend SMTP, you need:
- **Host**: `smtp.resend.com`
- **Port**: `465`
- **Username**: `resend`
- **Password**: Your Resend API key (not a separate password)
- **Sender Email**: `team@arogyavault.me` (your verified domain)
- **Sender Name**: `Arogya Vault`

**Important**: Resend SMTP uses your Resend API key as the password. You can find your API key in:
- Resend Dashboard > API Keys
- Or use the same API key you use for Resend API: `re_aTQdE3cc_8RK6sjHAMguiYoLcEWh4KSpz`

### Step 2: Update Environment Variables

Add the following to your `.env` file:

```env
# Email Provider (use "smtp" for Supabase SMTP, "resend" for Resend API)
EMAIL_PROVIDER=smtp

# SMTP Configuration (for Resend SMTP)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USERNAME=resend
SMTP_PASSWORD=your_resend_api_key_here  # Use your Resend API key as password

# Email Sender Configuration
EMAIL_FROM=team@arogyavault.me
EMAIL_FROM_NAME=Arogya Vault
```

### Step 3: Restart Server

After updating the `.env` file, restart your server:

```bash
npm run dev
```

## Verification

When the server starts, you should see:

```
✅ SMTP email service initialized
   Host: smtp.resend.com
   Port: 465
   Secure: true
   Username: resend
   From Email: team@arogyavault.me
   From Name: Arogya Vault
✅ SMTP connection verified successfully
```

## How It Works

1. **SMTP Service**: Uses `nodemailer` to connect to Resend's SMTP server
2. **Connection**: Establishes secure connection (TLS) on port 465
3. **Authentication**: Uses username `resend` and your SMTP password
4. **Sending**: Sends emails from `team@arogyavault.me` (your verified domain)

## Email Providers

The system supports three email providers:

1. **SMTP** (`EMAIL_PROVIDER=smtp`): Uses Supabase's SMTP configuration with Resend
2. **Resend API** (`EMAIL_PROVIDER=resend`): Uses Resend API directly
3. **Mock** (`EMAIL_PROVIDER=mock` or no config): Logs emails to console (for development)

## Troubleshooting

### SMTP Connection Failed
- Verify your SMTP password is correct in `.env`
- Check that port 465 is not blocked by firewall
- Ensure `SMTP_SECURE=true` for port 465

### Emails Not Sending
- Check server logs for error messages
- Verify domain is verified in Resend dashboard
- Ensure sender email matches verified domain

### Password Not Working
- **Important**: For Resend SMTP, the password should be your Resend API key
- The SMTP password is the same as your Resend API key (starts with `re_`)
- Make sure you're using the correct API key from your Resend dashboard
- The API key should have the format: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Testing

To test the email service:

1. Add a medication with a reminder time
2. Wait for the reminder to trigger (or manually trigger it)
3. Check server logs for email sending confirmation
4. Verify the email is received in the inbox

## Security Notes

- SMTP password is stored in environment variables (never commit to git)
- All SMTP credentials are encrypted in Supabase's database
- Use secure connection (TLS) on port 465
- Never share your SMTP password

