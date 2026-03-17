# 🚀 Quick Start - Payment Testing

## ⚡ 5-Minute Setup

### Step 1: Database (2 minutes)
Open **Neon SQL Editor** and run these files in order:

```sql
-- 1. Add approved column
/ADD_APPROVED_COLUMN.sql

-- 2. Add M-Pesa table
/ADD_MPESA_TABLE.sql
```

**✅ Success:** You should see "✅ Approved column added successfully!" and "✅ M-Pesa tables created successfully!"

---

### Step 2: Get Test Credentials (2 minutes)

#### M-Pesa Sandbox (Free)
1. Go to: https://developer.safaricom.co.ke/
2. Sign up / Log in
3. Create new app (any name)
4. Copy these credentials:
   - Consumer Key
   - Consumer Secret
   - Test Credentials (Shortcode + Passkey)

#### PayPal Sandbox (Free)
1. Go to: https://developer.paypal.com/
2. Log in with PayPal
3. Dashboard → My Apps & Credentials
4. Create new app
5. Copy "Client ID"

---

### Step 3: Add Credentials (1 minute)

#### M-Pesa (`/api/index.ts` line ~1715)
Find and replace:
```typescript
const MPESA_CONSUMER_KEY = 'YOUR_MPESA_CONSUMER_KEY';
const MPESA_CONSUMER_SECRET = 'YOUR_MPESA_CONSUMER_SECRET';
const MPESA_SHORTCODE = 'YOUR_BUSINESS_SHORTCODE';
const MPESA_PASSKEY = 'YOUR_MPESA_PASSKEY';
const MPESA_CALLBACK_URL = 'https://skyway-suites.vercel.app/api?endpoint=mpesa-callback';
```

#### PayPal (`/src/app/pages/MyBookings.tsx` line ~104)
Find and replace:
```typescript
const PAYPAL_CLIENT_ID = 'YOUR_PAYPAL_CLIENT_ID_HERE';
```

---

## 🧪 Test the Flow

### Test 1: Quick M-Pesa Test
```
1. Login as CUSTOMER
   → Go to /properties
   → Book any property
   → Fill dates + guests
   → Click "Book Now"

2. Login as ADMIN
   → Go to /admin/bookings
   → Find the booking
   → Click "Approve"

3. Login as CUSTOMER again
   → Click "My Bookings" in header
   → Click "Pay Now (KES X,XXX)"
   → Select "M-Pesa"
   → Enter: 254708374149 (test number)
   → Click "Send Payment Request"
   → Enter test PIN: 1234
   → ✅ Payment confirmed!

4. Check Status
   → Refresh "My Bookings"
   → Status should be "confirmed ✅"
```

### Test 2: PayPal Test
```
1-2. Same as above (book + approve)

3. Login as CUSTOMER
   → Go to "My Bookings"
   → Click "Pay Now"
   → Select "PayPal / Credit Card"
   → Use PayPal sandbox account
   → Complete payment
   → ✅ Payment confirmed!
```

---

## 📱 Test Phone Numbers (M-Pesa Sandbox)

```
254708374149 - Success scenario
254708374150 - Insufficient funds scenario  
254708374151 - Invalid account scenario
```

---

## 🎯 Expected Results

### Before Payment
```
┌────────────────────────────────┐
│ Status: awaiting payment       │
│ Total: KES 15,000             │
│ Paid: KES 0                   │
│ Remaining: KES 15,000         │
│                               │
│ [Pay Now (KES 15,000)]        │
└────────────────────────────────┘
```

### After M-Pesa Payment
```
┌────────────────────────────────┐
│ Status: confirmed ✅           │
│ Total: KES 15,000             │
│ Paid: KES 15,000              │
│                               │
│ [View Property]               │
└────────────────────────────────┘
```

---

## ❌ Troubleshooting

### "Failed to approve booking"
**Run:**
```sql
/ADD_APPROVED_COLUMN.sql
```

### "Failed to initiate M-Pesa payment"
**Check:**
1. M-Pesa credentials in `/api/index.ts`
2. Using sandbox URLs (not production)
3. Phone number format: 254XXXXXXXXX

### "Failed to load PayPal"
**Check:**
1. PayPal Client ID in `/src/app/pages/MyBookings.tsx`
2. Internet connection
3. Browser console for errors

### Payment not appearing in Admin
**Check:**
1. Go to Admin → Payments
2. Check if payment was created
3. Verify booking status updated

---

## 🔍 Debug Tools

### Check Database
```sql
-- See all bookings with approval status
SELECT id, approved, status, total_price 
FROM bookings 
ORDER BY created_at DESC;

-- See all payments
SELECT * FROM payments 
ORDER BY created_at DESC;

-- See M-Pesa transactions
SELECT * FROM mpesa_transactions 
ORDER BY created_at DESC;
```

### Check Browser Console
```
F12 → Console
Look for:
- 🔍 APPROVE BOOKING
- 📱 M-Pesa Payment Request
- ✅ Payment successful
```

---

## 📊 Admin Views

### Admin → Bookings
You should see:
- "Approve" button for pending bookings
- "Pay" button for approved bookings
- Payment status (pending payment, partial payment, confirmed)

### Admin → Payments
You should see:
- All payments listed
- Payment method (MPesa, PayPal)
- Transaction ID
- Amount
- Status

---

## 🎉 Success Checklist

After testing, you should have:

- [ ] Booking created by customer
- [ ] Admin approved the booking
- [ ] Customer saw "My Bookings" page
- [ ] Customer clicked "Pay Now"
- [ ] Payment completed (M-Pesa or PayPal)
- [ ] Booking status changed to "confirmed"
- [ ] Payment appears in Admin → Payments
- [ ] Customer can view property details

---

## 🚀 Go Live

When ready for production:

### 1. Switch M-Pesa to Production
```typescript
// Change URLs in /api/index.ts
const tokenUrl = 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
const stkUrl = 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
```

### 2. Switch PayPal to Production
```typescript
// Use production Client ID in /src/app/pages/MyBookings.tsx
const PAYPAL_CLIENT_ID = 'YOUR_PRODUCTION_CLIENT_ID';
```

### 3. Update Callback URL
```typescript
// Use your actual domain
const MPESA_CALLBACK_URL = 'https://skyway-suites.vercel.app/api?endpoint=mpesa-callback';
```

---

## 📞 Need Help?

**M-Pesa Issues:**
- Support: apisupport@safaricom.co.ke
- Docs: https://developer.safaricom.co.ke/docs

**PayPal Issues:**
- Support: https://www.paypal-community.com/
- Docs: https://developer.paypal.com/docs/

**Vercel Deployment:**
- Docs: https://vercel.com/docs

---

**Ready to test? Start with Step 1! 🚀**
