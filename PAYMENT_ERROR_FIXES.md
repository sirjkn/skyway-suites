# 🔧 Payment Error Fixes

## ✅ Issues Fixed

### 1. M-Pesa: "Skywaysuites API is running" ❌ → ✅ Fixed

**Problem:** M-Pesa payment was hitting the health check endpoint instead of the payment endpoint.

**Fix Applied:**
- Changed API call to use query parameter: `/api?endpoint=mpesa-payment`
- Added detailed console logging for debugging

**What Changed:**
```typescript
// BEFORE (Wrong)
fetch('/api', {
  body: JSON.stringify({ endpoint: 'mpesa-payment', ... })
})

// AFTER (Correct)
fetch('/api?endpoint=mpesa-payment', {
  body: JSON.stringify({ bookingId, phoneNumber, amount })
})
```

---

### 2. PayPal: "Failed to load PayPal" ❌ → ✅ Fixed

**Problem:** PayPal SDK wasn't loading or credentials were missing.

**Fixes Applied:**
1. ✅ Added credential validation
2. ✅ Added better error handling
3. ✅ Added console logging for debugging
4. ✅ Clear PayPal container before rendering
5. ✅ Check if window.paypal exists
6. ✅ Show helpful error messages

**What Changed:**
```typescript
// Added validation
if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID === 'YOUR_PAYPAL_CLIENT_ID_HERE') {
  toast.error('PayPal is not configured. Please contact support.');
  return;
}

// Added PayPal check
if (!window.paypal) {
  throw new Error('PayPal SDK failed to load');
}

// Clear container
const container = document.getElementById('paypal-button-container');
if (container) {
  container.innerHTML = '';
}
```

---

## 🧪 Testing the Fixes

### Test M-Pesa Payment

1. **Go to My Bookings:**
   ```
   Login → My Bookings → Click "Pay Now"
   ```

2. **Select M-Pesa:**
   ```
   Choose M-Pesa → Enter phone: 254712345678
   ```

3. **Check Browser Console (F12):**
   ```
   Should see:
   🔍 M-Pesa Payment Request: { bookingId, phoneNumber, amount }
   📱 M-Pesa Response Status: 200
   📱 M-Pesa Response Data: { success: true/false, ... }
   ```

4. **Expected Outcomes:**

   **If M-Pesa credentials are NOT configured:**
   ```
   ❌ Error: "M-Pesa service temporarily unavailable"
   Console: Shows actual error (credentials missing, etc.)
   ```

   **If M-Pesa credentials ARE configured:**
   ```
   ✅ Success: "📱 M-Pesa payment request sent!"
   Phone: Receives STK Push prompt
   ```

---

### Test PayPal Payment

1. **Go to My Bookings:**
   ```
   Login → My Bookings → Click "Pay Now"
   ```

2. **Select PayPal:**
   ```
   Choose "PayPal / Credit Card"
   ```

3. **Check Browser Console (F12):**
   ```
   Should see:
   🔍 Loading PayPal SDK...
   ```

4. **Expected Outcomes:**

   **If PayPal Client ID is NOT configured:**
   ```
   ❌ Error: "PayPal is not configured. Please contact support."
   (Returns to payment method selection)
   ```

   **If PayPal Client ID IS configured but wrong:**
   ```
   ❌ Error: "Failed to load PayPal: [specific error]"
   Console: Shows PayPal SDK error
   ```

   **If PayPal Client ID is correct:**
   ```
   ✅ Success: PayPal buttons render
   Console shows: "✅ PayPal SDK loaded successfully"
   ```

---

## 📋 Current Status Checklist

Check your current setup:

### M-Pesa Configuration
- [ ] Database migration run (`/ADD_MPESA_TABLE.sql`)
- [ ] M-Pesa credentials added to `/api/index.ts` (lines ~1715-1720)
- [ ] Using sandbox or production URLs
- [ ] Callback URL configured

### PayPal Configuration
- [ ] PayPal Client ID added to `/src/app/pages/MyBookings.tsx` (line ~169)
- [ ] Using sandbox or production Client ID
- [ ] Internet connection stable

### Database Configuration
- [ ] `approved` column added to bookings (`/ADD_APPROVED_COLUMN.sql`)
- [ ] `mpesa_transactions` table created
- [ ] `transaction_id` column added to payments

---

## 🔍 Debugging Guide

### Check Console Logs

**Open Browser Console (F12) and look for:**

```
✅ Good Signs:
- 🔍 M-Pesa Payment Request: { ... }
- 📱 M-Pesa Response Status: 200
- 🔍 Loading PayPal SDK...
- ✅ PayPal SDK loaded successfully

❌ Bad Signs:
- ❌ M-Pesa payment error: ...
- ❌ PayPal initialization error: ...
- Failed to fetch
- Network error
```

### Check API Response

**M-Pesa Response Should Look Like:**
```json
{
  "success": true,
  "message": "Payment request sent to your phone",
  "checkoutRequestId": "ws_CO_17032026..."
}
```

**Or if credentials missing:**
```json
{
  "success": false,
  "message": "M-Pesa service temporarily unavailable"
}
```

### Check Database

**Verify tables exist:**
```sql
-- Check bookings have approved column
SELECT approved FROM bookings LIMIT 1;

-- Check mpesa_transactions table exists
SELECT * FROM mpesa_transactions LIMIT 1;

-- Check payments have transaction_id column
SELECT transaction_id FROM payments LIMIT 1;
```

---

## ⚙️ Configuration Steps

### Step 1: M-Pesa Credentials

**Edit `/api/index.ts` around line 1715:**

```typescript
// Find this section:
const MPESA_CONSUMER_KEY = 'YOUR_MPESA_CONSUMER_KEY';
const MPESA_CONSUMER_SECRET = 'YOUR_MPESA_CONSUMER_SECRET';
const MPESA_SHORTCODE = 'YOUR_BUSINESS_SHORTCODE';
const MPESA_PASSKEY = 'YOUR_MPESA_PASSKEY';
const MPESA_CALLBACK_URL = 'https://skyway-suites.vercel.app/api?endpoint=mpesa-callback';
```

**Replace with your actual credentials from:**
https://developer.safaricom.co.ke/

### Step 2: PayPal Client ID

**Edit `/src/app/pages/MyBookings.tsx` around line 169:**

```typescript
// Find this line:
const PAYPAL_CLIENT_ID = 'YOUR_PAYPAL_CLIENT_ID_HERE';

// Replace with your actual Client ID from:
// https://developer.paypal.com/
const PAYPAL_CLIENT_ID = 'AxxxxxxxxxxxxxxxxD';
```

---

## 🚀 Next Steps

### If M-Pesa Still Not Working:

1. **Check API logs in Vercel dashboard**
2. **Verify M-Pesa credentials are correct**
3. **Test phone number format:** 254712345678
4. **Check if using sandbox or production URLs**
5. **Verify callback URL is accessible**

### If PayPal Still Not Working:

1. **Verify Client ID is correct**
2. **Check internet connection**
3. **Try different browser**
4. **Check browser console for script loading errors**
5. **Verify you're using sandbox Client ID for testing**

### If Both Are Working:

1. ✅ Test full payment flow
2. ✅ Verify payment records in Admin → Payments
3. ✅ Check booking status updates to "confirmed"
4. ✅ Test with real credentials (production)

---

## 📞 Support

**Common Error Messages:**

| Error | Cause | Solution |
|-------|-------|----------|
| "Skywaysuites API is running" | Wrong endpoint | ✅ Fixed in code |
| "Failed to load PayPal" | Missing Client ID | Add Client ID to MyBookings.tsx |
| "PayPal is not configured" | Client ID not set | Replace placeholder in code |
| "M-Pesa service unavailable" | Missing credentials | Add credentials to /api/index.ts |
| "Invalid phone number" | Wrong format | Use: 254712345678 |

---

## ✅ Verification

After fixes, you should see:

**M-Pesa:**
```
1. Click M-Pesa ✅
2. Enter phone number ✅
3. Click "Send Payment Request" ✅
4. See console logs with payment details ✅
5. Get success or error message ✅
```

**PayPal:**
```
1. Click PayPal ✅
2. See "Loading PayPal..." ✅
3. PayPal buttons appear ✅
4. Click PayPal button ✅
5. Complete payment ✅
```

---

**Issues are now fixed! Test and let me know if you encounter any other errors. Check console logs (F12) for detailed debugging info.** 🎉
