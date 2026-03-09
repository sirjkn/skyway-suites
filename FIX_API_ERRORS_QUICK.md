# 🚑 Quick Fix for API Errors

You're getting these errors:
- ❌ "Failed to process payment"
- ❌ "Failed to delete booking"
- ❌ "Failed to delete property"
- ❌ "Failed to delete customer"

## 🎯 Most Likely Fix (Do This First!)

### The Problem:
Your **DATABASE_URL environment variable is probably NOT set in Vercel** or the database tables don't exist.

### The Solution:

#### Step 1: Set DATABASE_URL in Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click your **Skyway Suites** project
3. Click **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Enter:
   - **Name:** `DATABASE_URL`
   - **Value:** Your Neon connection string (from neon.tech)
   - **Environments:** Check ALL boxes (Production, Preview, Development)
6. Click **"Save"**

#### Step 2: Get Your Neon Connection String

1. Go to [neon.tech](https://neon.tech)
2. Click your project
3. Click **"Connection Details"** or **"Dashboard"**
4. Copy the **Connection String** (looks like this):
   ```
   postgresql://username:password@host.neon.tech/database?sslmode=require
   ```

#### Step 3: Redeploy

1. In Vercel, go to **Deployments**
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes

#### Step 4: Initialize Database

1. Go to [neon.tech](https://neon.tech) → Your Project → **SQL Editor**
2. Copy the entire content from `/backend-api/setup-database.sql`
3. Paste it into the SQL Editor
4. Click **"Run"**
5. You should see "Success" messages

---

## 🧪 Test If It's Fixed

### Option 1: Use the Test Page

1. Open `/test-api.html` in your browser
2. Click **"Run All Tests"**
3. If all tests pass ✅ you're good!
4. If tests fail ❌ see the full troubleshooting guide

### Option 2: Manual Test

1. Go to your deployed app
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Try to delete a booking or create a payment
5. Look for the **actual error message** in the console (not the toast)

Common errors you'll see:

| Error in Console | What It Means | Fix |
|------------------|---------------|-----|
| `API endpoint not available` | DATABASE_URL not set | Set it in Vercel (Step 1 above) |
| `table "bookings" does not exist` | Database not initialized | Run setup script (Step 4 above) |
| `column "booking_id" does not exist` | Wrong column names | Run setup script (Step 4 above) |
| `Failed to fetch` | Deployment issue | Check Vercel deployment status |

---

## 📊 Verify Your Setup

### Check 1: Environment Variable Set?

```bash
# In Vercel Dashboard:
# Settings → Environment Variables
# Should see:
#   DATABASE_URL = postgresql://...
#   ✓ Production ✓ Preview ✓ Development
```

### Check 2: Database Tables Exist?

```sql
-- Run this in Neon SQL Editor:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should show:
-- properties
-- customers
-- bookings
-- payments
-- users
-- settings
```

### Check 3: Latest Code Deployed?

```bash
# In Vercel Dashboard:
# Deployments → Latest Deployment
# Check "Functions" tab
# Should see 8 functions:
# - /api/auth
# - /api/bookings
# - /api/customers
# - /api/payments
# - /api/properties
# - /api/settings
# - /api/contact
# - /api/health
```

---

## 🔍 Still Not Working?

### Get the Real Error Message

1. **Browser Console:**
   - Press F12
   - Go to Console tab
   - Try the failing operation
   - Copy the red error message

2. **Vercel Function Logs:**
   - Vercel → Deployments → Latest → Functions
   - Click the failing endpoint (e.g., `/api/payments`)
   - Look for red error messages
   - Copy the error

3. **Network Tab:**
   - Press F12 → Network tab
   - Try the failing operation
   - Click the failed request (red)
   - Click "Response" tab
   - Copy the error

Then read `/TROUBLESHOOTING_API_ERRORS.md` for detailed solutions.

---

## ✅ Quick Checklist

Before asking for help, verify:

- [ ] `DATABASE_URL` is set in Vercel (all 3 environments checked)
- [ ] Redeployed after adding `DATABASE_URL`
- [ ] Ran `/backend-api/setup-database.sql` in Neon SQL Editor
- [ ] Vercel deployment shows "Ready" (not failed)
- [ ] Latest git commit is deployed (check Vercel)
- [ ] Cleared browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- [ ] Checked browser console for actual error
- [ ] Checked Vercel Function logs for actual error

---

## 🎯 Summary

**The fix is usually this simple:**

1. Set `DATABASE_URL` in Vercel environment variables ← **This is 90% of issues**
2. Run `/backend-api/setup-database.sql` in Neon
3. Redeploy in Vercel
4. Clear browser cache
5. Test again

**If that doesn't work:**

- Check browser console for the real error
- Check Vercel Function logs for database errors
- Read `/TROUBLESHOOTING_API_ERRORS.md` for detailed help
- Use `/test-api.html` to diagnose which endpoints are failing

Good luck! 🚀
