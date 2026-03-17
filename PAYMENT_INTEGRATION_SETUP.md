# 💳 Payment Integration Setup Guide

## Overview
This guide helps you set up **M-Pesa** and **PayPal** payment integrations for customer bookings.

---

## 🎯 What's New

### Customer Payment Flow
1. ✅ **My Bookings Page** - Customers can view all their bookings at `/my-bookings`
2. ✅ **Payment Options** - M-Pesa and PayPal card payments
3. ✅ **Booking Status Tracking** - Real-time status updates
4. ✅ **Payment History** - Track partial and full payments

### Admin Features
1. ✅ **Approve Bookings** - Admin approves bookings before customer can pay
2. ✅ **Payment Tracking** - See all payments in Admin → Payments
3. ✅ **M-Pesa Callbacks** - Automatic payment confirmation

---

## 📋 Step-by-Step Setup

### Step 1: Database Setup

**Run these SQL scripts in Neon SQL Editor:**

#### 1.1 Add Approved Column to Bookings
```bash
# In Neon SQL Editor, run:
/ADD_APPROVED_COLUMN.sql
```

#### 1.2 Add M-Pesa Transactions Table
```bash
# In Neon SQL Editor, run:
/ADD_MPESA_TABLE.sql
```

**Expected Result:** ✅ "M-Pesa tables created successfully!"

---

### Step 2: M-Pesa Integration (Safaricom Daraja API)

#### 2.1 Get M-Pesa Credentials

1. **Go to:** https://developer.safaricom.co.ke/
2. **Create an account** or log in
3. **Create a new app** in the dashboard
4. **Get your credentials:**
   - Consumer Key
   - Consumer Secret
   - Business Short Code (e.g., 174379 for sandbox)
   - Passkey

#### 2.2 Update API Configuration

**In `/api/index.ts`, find the M-Pesa section and replace:**

```typescript
// IMPORTANT: Replace these with your actual Safaricom Daraja API credentials
const MPESA_CONSUMER_KEY = 'YOUR_MPESA_CONSUMER_KEY';
const MPESA_CONSUMER_SECRET = 'YOUR_MPESA_CONSUMER_SECRET';
const MPESA_SHORTCODE = 'YOUR_BUSINESS_SHORTCODE'; // e.g., 174379
const MPESA_PASSKEY = 'YOUR_MPESA_PASSKEY';
const MPESA_CALLBACK_URL = 'https://your-domain.com/api?endpoint=mpesa-callback';
```

**Replace with your actual values:**
```typescript
const MPESA_CONSUMER_KEY = 'xxxxxxxxxxxxxxxxxxx';
const MPESA_CONSUMER_SECRET = 'xxxxxxxxxxxxxxxxxxx';
const MPESA_SHORTCODE = '174379'; // Your actual shortcode
const MPESA_PASSKEY = 'xxxxxxxxxxxxxxxxxxx';
const MPESA_CALLBACK_URL = 'https://skyway-suites.vercel.app/api?endpoint=mpesa-callback';
```

#### 2.3 Testing vs Production

**Sandbox (Testing):**
```typescript
// Use sandbox URLs
const tokenUrl = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
const stkUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
```

**Production (Live):**
```typescript
// Use production URLs
const tokenUrl = 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
const stkUrl = 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
```

---

### Step 3: PayPal Integration

#### 3.1 Get PayPal Credentials

1. **Go to:** https://developer.paypal.com/
2. **Log in** with your PayPal account
3. **Create an app** in the Dashboard → My Apps & Credentials
4. **Copy your Client ID**

#### 3.2 Update PayPal Configuration

**In `/src/app/pages/MyBookings.tsx`, find:**

```typescript
const PAYPAL_CLIENT_ID = 'YOUR_PAYPAL_CLIENT_ID_HERE';
```

**Replace with your actual Client ID:**
```typescript
const PAYPAL_CLIENT_ID = 'AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxD';
```

#### 3.3 Currency Conversion

PayPal uses USD. The app converts KES to USD automatically:
```typescript
// Current conversion rate (approx)
const usdAmount = (kesAmount / 130).toFixed(2);
```

**Update the conversion rate** as needed in `MyBookings.tsx`.

---

### Step 4: Test the Payment Flow

#### 4.1 M-Pesa Testing

1. **Create a test booking:**
   - Login as customer
   - Book a property
   
2. **Admin approves:**
   - Login as admin
   - Go to Admin → Bookings
   - Click "Approve" on the booking

3. **Customer pays:**
   - Customer goes to "My Bookings"
   - Clicks "Pay Now"
   - Selects "M-Pesa"
   - Enters phone number (254712345678)
   - Completes payment on phone

4. **Verify:**
   - Check Admin → Payments
   - Booking status should be "confirmed"

#### 4.2 PayPal Testing

1. **Create a test booking** (same as above)
2. **Admin approves** (same as above)
3. **Customer pays:**
   - Goes to "My Bookings"
   - Clicks "Pay Now"
   - Selects "PayPal / Credit Card"
   - Uses PayPal sandbox test card or account
   - Completes payment

4. **Verify in Admin → Payments**

---

## 🔧 Configuration Summary

### Environment Variables (Hardcoded in Code)

**M-Pesa (`/api/index.ts`):**
```typescript
MPESA_CONSUMER_KEY = 'your_key_here'
MPESA_CONSUMER_SECRET = 'your_secret_here'
MPESA_SHORTCODE = 'your_shortcode'
MPESA_PASSKEY = 'your_passkey'
MPESA_CALLBACK_URL = 'https://your-domain.vercel.app/api?endpoint=mpesa-callback'
```

**PayPal (`/src/app/pages/MyBookings.tsx`):**
```typescript
PAYPAL_CLIENT_ID = 'your_client_id_here'
```

---

## 🎨 Customer Experience

### Before Payment
```
┌─────────────────────────────────────┐
│ Booking Status: Awaiting Payment   │
│ Total: KES 15,000                   │
│ Paid: KES 0                         │
│ Remaining: KES 15,000               │
│                                     │
│ [Pay Now (KES 15,000)]              │
└─────────────────────────────────────┘
```

### Payment Options
```
┌─────────────────────────────────────┐
│ Choose Payment Method               │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 📱 M-Pesa                    │   │
│ │ Pay via M-Pesa STK Push      │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 💳 PayPal / Credit Card      │   │
│ │ Pay with any credit card     │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### After Payment
```
┌─────────────────────────────────────┐
│ Booking Status: Confirmed ✅        │
│ Total: KES 15,000                   │
│ Paid: KES 15,000                    │
│                                     │
│ [View Property]                     │
└─────────────────────────────────────┘
```

---

## 🚨 Troubleshooting

### M-Pesa Issues

**Problem:** "Failed to initiate M-Pesa payment"
**Solution:**
1. Check your M-Pesa credentials in `/api/index.ts`
2. Verify callback URL is publicly accessible
3. Check if using sandbox vs production URLs
4. Verify phone number format (254XXXXXXXXX)

**Problem:** Payment request sent but no callback received
**Solution:**
1. Check M-Pesa callback endpoint logs
2. Verify callback URL is registered in Daraja portal
3. Ensure callback URL is HTTPS (required by Safaricom)

### PayPal Issues

**Problem:** "Failed to load PayPal"
**Solution:**
1. Check PayPal Client ID in `/src/app/pages/MyBookings.tsx`
2. Verify internet connection
3. Check browser console for errors

**Problem:** Payment successful but not recorded
**Solution:**
1. Check browser console for API errors
2. Verify payments table exists in database
3. Check network tab for failed API calls

---

## 📊 Database Tables

### mpesa_transactions
```sql
- id (UUID)
- checkout_request_id (VARCHAR)
- booking_id (UUID)
- phone_number (VARCHAR)
- amount (DECIMAL)
- mpesa_receipt_number (VARCHAR)
- status (VARCHAR) -- pending, completed, failed
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### payments
```sql
- id (UUID)
- booking_id (UUID)
- customer_id (UUID)
- amount (DECIMAL)
- payment_method (VARCHAR) -- MPesa, PayPal, Card, Cash
- status (VARCHAR) -- paid, pending, failed
- transaction_id (VARCHAR) -- M-Pesa receipt or PayPal order ID
- created_at (TIMESTAMP)
```

### bookings
```sql
- approved (BOOLEAN) -- NEW: admin must approve before payment
```

---

## 🎉 Success Checklist

- [ ] Ran `/ADD_APPROVED_COLUMN.sql` in Neon
- [ ] Ran `/ADD_MPESA_TABLE.sql` in Neon
- [ ] Added M-Pesa credentials to `/api/index.ts`
- [ ] Added PayPal Client ID to `/src/app/pages/MyBookings.tsx`
- [ ] Tested M-Pesa payment flow
- [ ] Tested PayPal payment flow
- [ ] Verified payments appear in Admin → Payments
- [ ] Verified booking status updates to "confirmed"

---

## 🔐 Security Notes

1. **Never commit credentials to Git**
2. **Use environment variables in production** (not hardcoded)
3. **Enable webhook signature verification** for M-Pesa callbacks
4. **Use HTTPS** for all payment endpoints
5. **Validate payment amounts** on the server side

---

## 📞 Support

For M-Pesa support:
- Safaricom Developer Portal: https://developer.safaricom.co.ke/
- Email: apisupport@safaricom.co.ke

For PayPal support:
- PayPal Developer: https://developer.paypal.com/
- Community: https://www.paypal-community.com/

---

## 🎯 Next Steps

1. **Test in sandbox** first
2. **Switch to production** credentials when ready
3. **Set up email notifications** for successful payments
4. **Add refund functionality** (optional)
5. **Implement payment receipts** (optional)

---

**Good luck with your payment integration! 🚀**
