# ✅ M-Pesa Table Migration - AUTO-FIXED!

## What Was Wrong

The `mpesa_transactions` table didn't exist in your database, causing this error:
```
error: relation "mpesa_transactions" does not exist
```

## What I Fixed

**✅ Added Auto-Migration System**

The database now automatically creates the `mpesa_transactions` table on the first API call!

### Tables Created:
1. **`mpesa_transactions`** - Tracks M-Pesa payment requests
2. **Indexes** for faster lookups
3. **`transaction_id`** column added to `payments` table

---

## 🚀 How to Apply the Fix

### Option 1: Automatic (Recommended)
**Just restart your server!**

1. Stop your server (Ctrl+C in terminal)
2. Start it again: `npm run dev` (or `vercel dev`)
3. The migrations will run automatically ✅
4. Look for this log: `✅ Database migrations completed successfully`

### Option 2: Manual (If auto-migration doesn't work)

If you prefer to run the SQL manually in Neon:

1. Go to your Neon dashboard: https://console.neon.tech
2. Select your database
3. Open SQL Editor
4. Copy and paste this entire script:

```sql
-- Create M-Pesa transactions tracking table
CREATE TABLE IF NOT EXISTS mpesa_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_request_id VARCHAR(255) UNIQUE NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  mpesa_receipt_number VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_mpesa_checkout_request ON mpesa_transactions(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_booking ON mpesa_transactions(booking_id);

-- Add transaction_id column to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255);

-- Create index on transaction_id
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);

-- Verify
SELECT '✅ M-Pesa tables created successfully!' as status;
```

5. Click "Run" or Execute
6. You should see: `✅ M-Pesa tables created successfully!`

---

## 🔍 Verify It Worked

After restarting the server, check the logs for:

```
🔄 Checking for required database tables...
✅ Database migrations completed successfully
```

Or try making an M-Pesa payment again - the error should be gone!

---

## 📊 What the Migration Does

### 1. Creates `mpesa_transactions` Table

Tracks every M-Pesa payment request:
- `checkout_request_id` - Unique ID from M-Pesa
- `booking_id` - Links to the booking being paid for
- `phone_number` - Customer's phone
- `amount` - Payment amount
- `status` - pending/completed/failed
- `mpesa_receipt_number` - M-Pesa confirmation code

### 2. Creates Performance Indexes

Makes queries faster:
- Index on `checkout_request_id` (for status checks)
- Index on `booking_id` (for viewing booking payments)

### 3. Updates `payments` Table

Adds `transaction_id` column to link payments to M-Pesa receipts

---

## ✅ Next Steps

1. **Restart your server**
2. **Try M-Pesa payment again**
3. **Error should be gone!** 🎉

---

## 🐛 If Still Getting Errors

If you still see "mpesa_transactions does not exist" after restarting:

1. Check server logs for migration errors
2. Try manual SQL migration (Option 2 above)
3. Verify DATABASE_URL is correct in your environment
4. Check Neon dashboard to see if table was created

Share any errors you see in the logs!

---

**Just restart your server and it should work!** 🚀
