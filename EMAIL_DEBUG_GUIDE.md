# 📧 Email Notification Debug Guide - Booking Notifications

## ✅ HOW TO KNOW IF EMAIL WAS SENT

### Method 1: Check Vercel Logs (BEST METHOD)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. Click on your **Skyway Suites** project
3. Click **"Logs"** or **"Functions"** tab
4. **Create a new booking** in your app
5. **Watch the logs in real-time** - you'll see:

#### ✅ SUCCESS LOGS (Email Sent):
```
✅ Booking created successfully: abc123-def456-...
📧 Starting email notification process...
🔍 Fetching customer details for ID: customer-id-here
✅ Customer found: { name: 'John Doe', email: 'john@example.com', hasPhone: true }
🔍 Fetching property details for ID: property-id-here
✅ Property found: { title: 'Luxury Villa' }
🔍 Fetching SMTP settings from database...
📋 SMTP Settings loaded: { 
  smtpHost: 'mail.skywaysuites.co.ke',
  smtpPort: '587',
  smtpUsername: 'info@skywaysuites.co.ke',
  smtpSecure: 'false',
  hasPassword: true,
  emailFromAddress: 'info@skywaysuites.co.ke',
  emailFromName: 'Skyway Suites'
}
✅ All email prerequisites met - proceeding to send emails
📧 Creating email transporter with config: { ... }
📤 Sending customer email to: john@example.com
✅ Customer email sent successfully! Message ID: <abc123@mail.skywaysuites.co.ke>
📤 Sending admin notification to: info@skywaysuites.co.ke
✅ Admin email sent successfully! Message ID: <def456@mail.skywaysuites.co.ke>
🎉 All booking notification emails sent successfully!
```

#### ⚠️ WARNING LOGS (Email NOT Sent - Missing Config):
```
✅ Booking created successfully: abc123-def456-...
📧 Starting email notification process...
🔍 Fetching customer details for ID: customer-id-here
✅ Customer found: { name: 'John Doe', email: 'john@example.com', hasPhone: true }
🔍 Fetching property details for ID: property-id-here
✅ Property found: { title: 'Luxury Villa' }
🔍 Fetching SMTP settings from database...
📋 SMTP Settings loaded: { smtpHost: undefined, ... }
⚠️ SMTP Host not configured - skipping email
⚠️ Email not sent. Reason: SMTP not configured
```

**FIX:** Go to Admin → Settings → Notifications and configure SMTP

#### ❌ ERROR LOGS (Email Failed):
```
✅ Booking created successfully: abc123-def456-...
📧 Starting email notification process...
✅ Customer found: { ... }
✅ Property found: { ... }
✅ All email prerequisites met - proceeding to send emails
📧 Creating email transporter with config: { ... }
📤 Sending customer email to: john@example.com
❌ BOOKING EMAIL ERROR: Error: Connection timeout
Error details: {
  message: 'Connection timeout',
  code: 'ETIMEDOUT',
  command: 'CONN'
}
⚠️ Email not sent. Reason: Connection timeout
```

**FIX:** Change SMTP Port from 465 to 587

---

### Method 2: Check Browser Console (Limited Info)

1. Open **Developer Tools** (F12)
2. Go to **Console** tab
3. Create a booking
4. Look for toast notifications:
   - ✅ "Booking request submitted successfully!"
   - 📧 "Confirmation email sent to your email address"

---

### Method 3: Check API Response (Advanced)

1. Open **Developer Tools** (F12)
2. Go to **Network** tab
3. Create a booking
4. Click on the request to `/api/?endpoint=bookings`
5. Check the **Response** tab
6. Look for `emailStatus` field:

```json
{
  "booking": { ... },
  "emailStatus": {
    "sent": true,  // ✅ Email was sent!
    "error": null
  }
}
```

OR if failed:

```json
{
  "booking": { ... },
  "emailStatus": {
    "sent": false,  // ❌ Email NOT sent
    "error": "SMTP not configured"
  }
}
```

---

## 🔍 What to Look For in Logs

### ✅ SUCCESS - Email Sent
```
📧 Starting email notification process...
🔍 Fetching customer details for ID: abc123
✅ Customer found: { name: 'John Doe', email: 'john@example.com' }
✅ Property found: { title: 'Luxury Villa' }
📋 SMTP Settings loaded: {
  smtpHost: 'mail.skywaysuites.co.ke',
  smtpPort: '587',
  smtpUsername: 'info@skywaysuites.co.ke',
  smtpSecure: 'false',
  hasPassword: true
}
✅ All email prerequisites met - proceeding to send emails
📧 Creating email transporter with config: {...}
📤 Sending customer email to: john@example.com
✅ Customer email sent successfully! Message ID: abc123@mail.skywaysuites.co.ke
📤 Sending admin notification to: info@skywaysuites.co.ke
✅ Admin email sent successfully! Message ID: def456@mail.skywaysuites.co.ke
🎉 All booking notification emails sent successfully!
```

### ⚠️ WARNING - Missing Configuration
```
📧 Starting email notification process...
🔍 Fetching SMTP settings from database...
📋 SMTP Settings loaded: { smtpHost: undefined, ... }
⚠️ SMTP Host not configured - skipping email
⚠️ Email not sent. Missing configuration or customer email.
```

**Fix:** Go to Admin → Settings → Notifications and configure SMTP settings

### ❌ ERROR - Email Failed
```
📧 Starting email notification process...
✅ All email prerequisites met - proceeding to send emails
📤 Sending customer email to: john@example.com
❌ BOOKING EMAIL ERROR: Error: Connection timeout
Error details: {
  message: 'Connection timeout',
  code: 'ETIMEDOUT',
  command: 'CONN'
}
```

**Fix:** Check port (use 587 instead of 465) and SMTP credentials

---

## 🛠️ Troubleshooting

### Problem: "⚠️ SMTP Host not configured"
**Solution:** 
1. Go to Admin → Settings → Notifications
2. Fill in all SMTP details
3. Click "Save Settings"
4. Send a test email first

### Problem: "⚠️ Customer email not found"
**Solution:**
1. Go to Admin → Customers
2. Verify the customer has an email address
3. Edit the customer and add email if missing

### Problem: "❌ BOOKING EMAIL ERROR: ETIMEDOUT"
**Solution:**
1. Change SMTP Port from **465** to **587**
2. Make sure "Use SSL/TLS" is **unchecked** (use STARTTLS)
3. Vercel blocks port 465

### Problem: "❌ BOOKING EMAIL ERROR: EAUTH"
**Solution:**
1. Verify SMTP username and password are correct
2. Check if your email provider requires app-specific passwords
3. Try sending a test email from Settings first

---

## 📧 Test Email First!

**Before creating bookings, always test your email configuration:**

1. Go to **Admin → Settings → Notifications**
2. Enter your email in "Test Email Address"
3. Click "Send Test Email"
4. Check your inbox (and spam folder)
5. If successful, booking emails will work too!

---

## 🎯 Quick Checklist

Before creating a booking, verify:
- [ ] SMTP Host is configured
- [ ] SMTP Port is **587** (not 465)
- [ ] SMTP Username is set
- [ ] SMTP Password is set
- [ ] SSL/TLS is **unchecked** (use STARTTLS)
- [ ] Test email works successfully
- [ ] Customer has a valid email address

---

## 📞 Still Not Working?

If emails still aren't sending after checking all above:

1. **Check Vercel Logs** for detailed error messages
2. **Verify your SMTP server** allows connections from Vercel's IPs
3. **Contact your email provider** to confirm SMTP is enabled
4. **Try a different SMTP provider** (Gmail, SendGrid, etc.)