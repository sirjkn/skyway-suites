# 🚀 QUICK FIX - M-Pesa "Temporarily Unavailable"

## ⚡ 2-Minute Fix

### Problem
```
❌ "M-Pesa Services Temporarily Unavailable"
```

### Solution (Already Done!)
✅ API now reads from database instead of hardcoded values

---

## 📍 What YOU Need to Do

### 1️⃣ Get M-Pesa Credentials (5 min)

Go to: **https://developer.safaricom.co.ke/**

**For Sandbox (Testing):**
```
Consumer Key:     (from Safaricom dashboard)
Consumer Secret:  (from Safaricom dashboard)
Shortcode:        174379 (default sandbox)
Passkey:          (from Safaricom dashboard)
```

**For Live (Production):**
- Apply for Paybill/Till Number
- Get approved credentials

---

### 2️⃣ Configure in Admin (2 min)

**Navigate:**
```
Admin → Settings → Notifications Tab → Scroll Down → "Payment Settings"
```

**Fill in:**
1. ✅ M-Pesa Consumer Key
2. ✅ M-Pesa Consumer Secret
3. ✅ M-Pesa Shortcode
4. ✅ M-Pesa Passkey
5. ✅ M-Pesa Callback URL: `https://your-domain.vercel.app/api?endpoint=mpesa-callback`
6. ✅ M-Pesa Environment: **Sandbox** (for testing)
7. ✅ M-Pesa Test Phone: `254712345678`

**Click:**
```
[Test M-Pesa] button → Should say "✅ M-Pesa credentials validated!"
[Save Payment Settings] → Should say "✅ Payment settings saved!"
```

---

### 3️⃣ Test Payment (1 min)

**As Customer:**
```
Login → My Bookings → Pay Now → Select M-Pesa → Enter phone → Send Payment Request
```

**Expected:**
```
✅ "📱 M-Pesa payment request sent! Check your phone to complete payment."
```

**Console (F12):**
```
🔍 M-Pesa Payment Request: {...}
🔍 Settings fetched: 6 rows
✅ M-Pesa credentials validated, environment: sandbox
✅ M-Pesa access token obtained
✅ M-Pesa STK Response: { ResponseCode: '0', ... }
```

---

## 🔍 Troubleshooting

### Still seeing "Temporarily Unavailable"?

**Check Console (F12):**

**If you see:**
```
❌ M-Pesa credentials missing: { hasKey: false, hasSecret: false, ... }
```
**Solution:** Go to Admin Settings and enter your credentials

---

**If you see:**
```
❌ Failed to get M-Pesa token: { error: "invalid_client_credentials" }
```
**Solution:** Consumer Key or Secret is wrong - check in Safaricom dashboard

---

**If you see:**
```
❌ M-Pesa STK Push failed: { errorMessage: "Bad Request - Invalid Amount" }
```
**Solution:** Booking amount might be 0 or invalid

---

## ✅ Success Indicators

When working correctly, you'll see:

**Admin Settings:**
- ✅ "Test M-Pesa" shows success
- ✅ "Save Payment Settings" shows success

**Customer Payment:**
- ✅ No "temporarily unavailable" error
- ✅ Toast: "Payment request sent to your phone"
- ✅ Phone receives STK Push notification

**Console Logs:**
```
✅ M-Pesa credentials validated
✅ M-Pesa access token obtained
✅ M-Pesa STK Response: { ResponseCode: '0' }
```

**Database:**
```sql
SELECT * FROM mpesa_transactions ORDER BY created_at DESC LIMIT 1;
-- Should show your test transaction
```

---

## 🎯 Same for PayPal

### 1️⃣ Get PayPal Client ID

**Go to:** https://developer.paypal.com/

**Get:**
- Sandbox Client ID (for testing)
- Live Client ID (for production)

### 2️⃣ Configure

**Admin → Settings → Notifications → Payment Settings**

1. ✅ PayPal Client ID: `Axxxxxxxxxx`
2. ✅ PayPal Environment: **Sandbox**
3. Click **[Validate PayPal]** → Should show success
4. Click **[Save Payment Settings]**

### 3️⃣ Test

**Customer → My Bookings → Pay Now → PayPal**

- ✅ PayPal buttons should appear
- ✅ Can complete payment

---

## 📊 What Changed (Technical)

**Before:**
```typescript
// Hardcoded in /api/index.ts
const MPESA_CONSUMER_KEY = 'YOUR_MPESA_CONSUMER_KEY';  // ❌
```

**After:**
```typescript
// Reads from database
const settingsResult = await query('SELECT key, value FROM settings...');
const MPESA_CONSUMER_KEY = settings.mpesaConsumerKey || '';  // ✅
```

**Before:**
```typescript
// Hardcoded in MyBookings.tsx
const PAYPAL_CLIENT_ID = 'YOUR_PAYPAL_CLIENT_ID_HERE';  // ❌
```

**After:**
```typescript
// Reads from API
const settings = await fetch('/api?endpoint=get-payment-settings');
const PAYPAL_CLIENT_ID = settings.paypalClientId || '';  // ✅
```

---

## 🎉 Done!

**The code is fixed. Now just:**

1. ✅ Get your M-Pesa credentials from Safaricom
2. ✅ Enter them in Admin → Settings → Notifications → Payment Settings
3. ✅ Click "Test M-Pesa" to validate
4. ✅ Click "Save Payment Settings"
5. ✅ Test payment as customer

**No more "M-Pesa Services Temporarily Unavailable"!** 🚀

---

## 📞 Need Help?

**Check:**
- Browser console (F12) for detailed logs
- `/PAYMENT_SETTINGS_READY.md` for full guide
- `/MPESA_FIX_SUMMARY.md` for technical details

**Common Issues:**
- ❌ "Not configured" → Enter credentials in Admin Settings
- ❌ "Invalid credentials" → Check Consumer Key/Secret
- ❌ "STK Push failed" → Check phone number format (254712345678)
