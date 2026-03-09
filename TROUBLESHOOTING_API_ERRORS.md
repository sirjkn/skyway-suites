# 🔧 Troubleshooting API Errors

## Your Error Messages

You're seeing these errors:
- ❌ "Failed to process payment"
- ❌ "Failed to delete booking"  
- ❌ "Failed to delete property"
- ❌ "Failed to delete customer"

## 🔍 Step-by-Step Debugging

### Step 1: Check Browser Console for Actual Errors

The toast messages are generic. The real error is in the browser console.

1. **Open your app** in the browser
2. **Press F12** to open Developer Tools
3. **Click the "Console" tab**
4. **Try the failing operation** (e.g., delete a booking)
5. **Look for red error messages**

**Common errors you'll see:**

#### Error: "API endpoint not available"
**Cause:** Vercel deployment not working or DATABASE_URL not set

**Solution:**
```bash
# Check Vercel deployment status
# Go to vercel.com → Your Project → Deployments

# Verify DATABASE_URL is set:
# Settings → Environment Variables → Check DATABASE_URL exists
```

#### Error: "Failed to process request" with 500 status
**Cause:** Database query failing (likely foreign key constraint or column name mismatch)

**Solution:** Check Vercel Function Logs (see Step 2)

#### Error: "Method not allowed" or 404
**Cause:** API route not found or incorrect URL

**Solution:** Verify you've deployed the latest code with consolidated API routes

---

### Step 2: Check Vercel Function Logs

1. Go to [vercel.com](https://vercel.com)
2. Click your project
3. Click **"Deployments"**
4. Click the latest deployment
5. Click **"Functions"** tab
6. Click on the failing function (e.g., `/api/payments`)
7. Look for error messages in red

**What to look for:**

```
Error: Connection to database failed
→ DATABASE_URL not set or invalid

Error: column "booking_id" does not exist  
→ Database schema mismatch

Error: foreign key constraint violation
→ Trying to delete record with dependencies

Error: undefined is not an object
→ Missing required field in request
```

---

### Step 3: Verify Database Schema

Your database needs these tables with exact column names:

```sql
-- Run this in Neon SQL Editor to verify schema
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('properties', 'bookings', 'customers', 'payments')
ORDER BY table_name, ordinal_position;
```

**Expected columns (snake_case):**

**Properties:**
- id (uuid)
- title (varchar)
- description (text)
- price (decimal)
- location (varchar)
- bedrooms (integer)
- bathrooms (integer)
- guests (integer)
- image (text)
- amenities (jsonb or text[])
- available (boolean)
- created_at (timestamp)

**Bookings:**
- id (uuid)
- property_id (uuid) ← Must be snake_case!
- customer_id (uuid) ← Must be snake_case!
- check_in (date)
- check_out (date)
- guests (integer)
- total_price (decimal)
- status (varchar)
- created_at (timestamp)

**Customers:**
- id (uuid)
- name (varchar)
- email (varchar)
- phone (varchar)
- password_hash (varchar) ← Added recently
- created_at (timestamp)

**Payments:**
- id (uuid)
- booking_id (uuid) ← Must be snake_case!
- customer_id (uuid) ← Must be snake_case!
- amount (decimal)
- status (varchar)
- payment_method (varchar)
- created_at (timestamp)

---

### Step 4: Common Fixes

#### Fix 1: Missing DATABASE_URL

```bash
# In Vercel Dashboard:
# 1. Settings → Environment Variables
# 2. Add new variable:
#    Name: DATABASE_URL
#    Value: postgresql://user:pass@host/db?sslmode=require
#    Environments: Production ✓ Preview ✓ Development ✓
# 3. Redeploy after adding
```

#### Fix 2: Database Not Initialized

Run the setup script in Neon SQL Editor:

1. Go to [neon.tech](https://neon.tech) → Your Project
2. Click **"SQL Editor"**
3. Copy and paste `/backend-api/setup-database.sql`
4. Click **"Run"**
5. Verify all tables created successfully

#### Fix 3: Column Name Mismatch

If your database has `bookingId` instead of `booking_id`:

```sql
-- Run this to fix column names (if needed)
ALTER TABLE bookings RENAME COLUMN bookingId TO booking_id;
ALTER TABLE bookings RENAME COLUMN customerId TO customer_id;
ALTER TABLE bookings RENAME COLUMN checkIn TO check_in;
ALTER TABLE bookings RENAME COLUMN checkOut TO check_out;
ALTER TABLE bookings RENAME COLUMN totalPrice TO total_price;
ALTER TABLE bookings RENAME COLUMN createdAt TO created_at;

ALTER TABLE payments RENAME COLUMN bookingId TO booking_id;
ALTER TABLE payments RENAME COLUMN customerId TO customer_id;
ALTER TABLE payments RENAME COLUMN paymentMethod TO payment_method;
ALTER TABLE payments RENAME COLUMN createdAt TO created_at;

ALTER TABLE customers RENAME COLUMN createdAt TO created_at;
ALTER TABLE customers RENAME COLUMN passwordHash TO password_hash;

ALTER TABLE properties RENAME COLUMN createdAt TO created_at;
```

#### Fix 4: Foreign Key Constraint (for deletions)

If you can't delete because of foreign key constraints, the database setup should already have `ON DELETE CASCADE`. Verify:

```sql
-- Check foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('bookings', 'payments');
```

Should show `delete_rule = 'CASCADE'` for all foreign keys.

If not, drop and recreate tables using `/backend-api/setup-database.sql`.

---

### Step 5: Test API Endpoints Manually

Use your browser or Postman to test:

#### Test 1: Create Payment
```bash
POST https://your-app.vercel.app/api/payments
Content-Type: application/json

{
  "booking_id": "uuid-here",
  "customer_id": "uuid-here",
  "amount": 100,
  "payment_method": "Credit Card"
}
```

**Expected:** 200 OK with payment object
**If error:** Check Vercel logs for specific error

#### Test 2: Delete Booking
```bash
DELETE https://your-app.vercel.app/api/bookings?id=uuid-here
```

**Expected:** 200 OK with success message
**If error:** Check if booking has associated payments (should cascade delete)

#### Test 3: Delete Property
```bash
DELETE https://your-app.vercel.app/api/properties?id=uuid-here
```

**Expected:** 200 OK with success message
**If error:** Check if property has bookings (should cascade delete)

---

## 🎯 Most Likely Causes

Based on your symptoms, here's the priority order:

### 1. DATABASE_URL Not Set in Vercel (90% likely)
**Symptom:** All operations fail
**Fix:** Add DATABASE_URL environment variable in Vercel → Settings → Environment Variables → Redeploy

### 2. Database Not Initialized (70% likely)
**Symptom:** "table does not exist" errors
**Fix:** Run `/backend-api/setup-database.sql` in Neon SQL Editor

### 3. Column Name Mismatch (50% likely)
**Symptom:** "column does not exist" errors in Vercel logs
**Fix:** Run column rename script above or recreate tables

### 4. Old Deployment Cached (30% likely)
**Symptom:** 404 errors on API routes
**Fix:** Hard redeploy in Vercel (uncheck "Use existing build cache")

### 5. CORS Issues (10% likely)
**Symptom:** Network errors in browser console
**Fix:** Already handled in API routes, but clear browser cache

---

## ✅ Quick Checklist

Run through this checklist:

- [ ] `DATABASE_URL` is set in Vercel environment variables
- [ ] Vercel deployment succeeded (no red errors)
- [ ] Latest code with consolidated API routes is deployed
- [ ] Database tables exist (check in Neon SQL Editor)
- [ ] Tables have correct column names (snake_case)
- [ ] Foreign key constraints exist with ON DELETE CASCADE
- [ ] Browser cache cleared (Ctrl+Shift+R)
- [ ] Checked Vercel Function logs for specific errors
- [ ] Checked browser console for specific errors

---

## 🆘 Still Not Working?

### Get Detailed Error Information

1. **Open browser console** (F12)
2. **Go to Network tab**
3. **Try the failing operation**
4. **Click the failed request** (will be red)
5. **Click "Response" tab**
6. **Copy the error message**

**Then check:**

1. **Vercel Function Logs:**
   - Vercel Dashboard → Deployments → Latest → Functions
   - Find the failing endpoint
   - Look for stack trace

2. **Neon Database Logs:**
   - Neon Dashboard → Your Project → Monitoring
   - Check for failed queries

3. **Environment Variables:**
   - Vercel → Settings → Environment Variables
   - Verify DATABASE_URL is set for all environments

---

## 📝 Common Error Messages Decoded

| Error Message | Meaning | Solution |
|--------------|---------|----------|
| "API endpoint not available" | Frontend can't reach API | Check deployment, DATABASE_URL |
| "Failed to process request" | Generic backend error | Check Vercel Function logs |
| "column does not exist" | Database schema mismatch | Run setup script or rename columns |
| "table does not exist" | Database not initialized | Run `/backend-api/setup-database.sql` |
| "foreign key violation" | Trying to delete parent record | Should auto-cascade, check constraints |
| "Method not allowed" | Wrong HTTP method | Check API route accepts the method |
| "Booking not found" | ID doesn't exist in database | Verify ID is correct |
| "Missing required fields" | Request missing data | Check request payload |

---

## 🔍 Enable Debug Mode (Temporary)

Add this to your `.env` file locally to see more details:

```bash
VITE_DEBUG=true
```

Then in `api.ts`, update the `fetchWithAuth` function to log errors:

```typescript
} catch (error) {
  if (import.meta.env.VITE_DEBUG) {
    console.error('API Error Details:', {
      url,
      method: options.method || 'GET',
      error: error instanceof Error ? error.message : error
    });
  }
  throw error;
}
```

This will show you exactly which API call is failing and why.

---

## 📞 Need More Help?

If you're still stuck after trying everything above:

1. **Share the exact error from:**
   - Browser console (F12 → Console tab)
   - Vercel Function logs (Deployments → Functions)
   - Network tab response (F12 → Network → Failed request → Response)

2. **Confirm you've:**
   - Set DATABASE_URL in Vercel
   - Run the database setup script
   - Deployed the latest code
   - Cleared browser cache

3. **Take screenshots of:**
   - Vercel environment variables page
   - Neon database tables list
   - Browser console errors
   - Vercel deployment status

With these details, we can pinpoint the exact issue! 🎯
