# 🔧 M-Pesa Payment Validation - Complete Fix Guide

## ✅ What Was Fixed

### 1. **DATABASE TABLE MISSING (CRITICAL FIX)** 
❌ **Error:** `relation "mpesa_transactions" does not exist`  
✅ **Fixed:** Auto-migration system now creates the table on startup

**To Apply:** Just **restart your server** (Ctrl+C, then `npm run dev`)

### 2. Smart Login Redirects
- **Login from Home page:**
  - Customers → `/my-bookings`
  - Admins → `/admin`
- **Login from other pages:** Returns to that page after login
- **Create Account:** Always goes to `/my-bookings`

### 3. Enhanced M-Pesa Logging
- Added detailed logging to see exactly what M-Pesa API returns
- Both frontend and backend now log ResultCode type (string vs number)
- Full API response logged for debugging

---

## 🚀 QUICK FIX - DO THIS FIRST!

**Your error was:** `relation "mpesa_transactions" does not exist`

**Solution:**
1. **Stop your server** (Ctrl+C in terminal)
2. **Restart it:** `npm run dev` (or `vercel dev`)
3. **Look for this log:** `✅ Database migrations completed successfully`
4. **Try M-Pesa payment again** - should work now! ✅

---

## 🐛 After Fixing the Table - Other Possible Issues

### Your Situation:
✅ You enter your REAL phone number  
✅ STK Push prompt arrives on your phone  
✅ You enter PIN and pay successfully  
✅ You receive M-Pesa transaction SMS  
❌ **System doesn't validate the payment**

---

## 🚨 MOST LIKELY CAUSE: Sandbox vs Live Mismatch

### The Problem:
You're using **SANDBOX credentials** but paying with your **REAL PHONE NUMBER**.

**Sandbox credentials ONLY work with test numbers (254708374149)**  
**Live credentials work with real phone numbers**

### The Solution:

#### ✅ Option A: Use Live/Production Credentials

1. Go to: http://localhost:3000/admin
2. Login as admin
3. Click "Settings" tab
4. Scroll to "Payment Settings (M-Pesa & PayPal)"
5. Change **Environment** to: **"Live (Production)"**
6. Enter your **LIVE** credentials from Safaricom:
   - Live Consumer Key
   - Live Consumer Secret
   - Live Business Shortcode (your Till or Paybill number)
   - Live Passkey
7. Click "Save Settings"
8. Test with YOUR real phone number
9. Payment will validate correctly! ✅

#### ✅ Option B: Use Sandbox (Testing Only)

1. Keep Environment as "Sandbox (Testing)"
2. Use phone: `254708374149` (test number only)
3. Note: You won't see STK on your real phone
4. This is for testing only

---

## 🔍 How to Debug Your Issue

### Step 1: Make a Payment
1. Go to "My Bookings"
2. Click "Pay Now"
3. Select M-Pesa
4. Enter your phone number
5. Click "Send Payment Request"
6. Pay on your phone

### Step 2: Check Payment Status
1. **DON'T close the payment dialog**
2. **Open browser console** (F12)
3. **Click "Check Payment Status"**
4. **Look at the logs**

### Step 3: What to Look For

#### In Browser Console:
```javascript
✅ Good logs:
🔍 Querying M-Pesa transaction status: ws_CO_xxxxx
✅ M-Pesa Query Response: {...}
🔍 ResultCode: 0 Type: number  ← This should be 0
📊 Status: completed
📊 Success: true
✅ Payment record created from query

❌ Bad logs (environment mismatch):
🔍 ResultCode: 1 Type: number  ← Request pending
📊 Status: pending
📊 Success: false
```

#### In Server Terminal:
```
✅ Good:
✅ M-Pesa Query Response: {
  ResultCode: '0',
  ResultDesc: 'The service request is processed successfully.'
}
✅ Payment record created from query

❌ Bad (environment mismatch):
✅ M-Pesa Query Response: {
  ResultCode: '1',
  ResultDesc: 'The request is pending'
}
⚠️ Unhandled ResultCode: 1
```

---

## 📋 M-Pesa ResultCode Reference

| Code | Meaning | What It Means For You |
|------|---------|----------------------|
| **0** | Success | ✅ Payment completed and validated |
| **1** | Pending | ⏳ Still processing (or environment mismatch) |
| **17** | Invalid phone | ❌ Phone number format wrong |
| **1032** | Cancelled | ❌ User cancelled payment |
| **1037** | Timeout | ⏱️ User didn't enter PIN in time |
| **2001** | Wrong PIN | ❌ User entered wrong PIN |

---

## ⚡ Quick Fix Checklist

- [ ] Are you using LIVE credentials for real phone numbers?
- [ ] Are you using SANDBOX credentials for test number (254708374149)?
- [ ] Did you save settings after changing environment?
- [ ] Did you wait 5-10 seconds after paying before checking status?
- [ ] Is your internet connection stable?
- [ ] Are you checking the browser console logs?

---

## 🎯 The Fix

### If Using Real Phone Number:

1. **Get Live Credentials:**
   - Go to https://developer.safaricom.co.ke
   - Create a **PRODUCTION** app (not sandbox)
   - Copy your Live Consumer Key and Consumer Secret
   - Get your Live Business Shortcode (Till/Paybill)
   - Get your Live Passkey

2. **Configure in Admin:**
   - Environment: **"Live (Production)"**
   - Enter all LIVE credentials
   - Save settings

3. **Test:**
   - Use your real phone number
   - Real money will be debited
   - Payment will validate correctly ✅

### If Testing with Sandbox:

1. **Use Sandbox Credentials:**
   ```
   Consumer Key: 9v38Dtu5u2BpsITPmLcXNWGMsjZRWSTG
   Consumer Secret: bclwIPbFqQFP8RZP
   Business Shortcode: 174379
   Passkey: bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
   Environment: Sandbox (Testing)
   ```

2. **Use Test Phone:**
   - Phone: `254708374149`
   - Note: You won't see real STK push

---

## 📤 Share Debug Info

If still not working, share these logs:

### From Browser Console:
```
[Copy everything from console after clicking "Check Payment Status"]
```

### From Server Terminal:
```
[Copy logs starting with 🔍 or ✅]
```

### Your Setup:
- Environment: [Sandbox or Live?]
- Phone used: [Your number or 254708374149?]
- Payment SMS received: [Yes/No]
- ResultCode shown: [What number?]

---

## 🚀 Expected Working Flow

1. Click "Pay Now" ✅
2. Select M-Pesa ✅
3. Enter phone number ✅
4. STK Push sent ✅
5. Enter PIN on phone ✅
6. Payment completed ✅
7. SMS received ✅
8. Click "Check Payment Status" ✅
9. **ResultCode = 0** ✅
10. **Payment record created** ✅
11. **Dialog closes** ✅
12. **Booking shows as paid** ✅

---

**Test now and share the console logs if it's still not working!** 🚀
