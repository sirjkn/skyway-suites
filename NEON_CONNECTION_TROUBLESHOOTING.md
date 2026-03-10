# Neon Database Connection Troubleshooting Guide

## What Was Fixed

### 1. **Removed Pulsing Bottom-Left Indicator**
- ✅ Deleted the DatabaseStatus component from the main Layout
- ✅ Now using ONLY the RealtimeIndicator on the bottom-right

### 2. **Enhanced Connection Status (Bottom-Right)**
- Shows on ALL pages (frontend and admin)
- 3 states with clear visual indicators:
  - 🔄 **Checking...** (gray with spinner)
  - ✅ **Neon DB Connected** (olive green #6B7C3C)
  - ❌ **Database Offline** (red)
- Displays error details when offline
- Updates every 30 seconds automatically

### 3. **Health Check Now Tests Real Database Connection**
Updated `/api/index.ts` health endpoint to:
```javascript
// Before: Just returned OK without testing DB
if (endpoint === 'health') {
  return res.status(200).json({ status: 'ok' });
}

// After: Actually tests the database connection
if (endpoint === 'health') {
  try {
    const result = await query('SELECT NOW() as current_time');
    return res.status(200).json({ 
      status: 'ok', 
      database: 'connected',
      dbTimestamp: result.rows[0].current_time
    });
  } catch (dbError) {
    return res.status(503).json({ 
      status: 'error',
      database: 'disconnected',
      error: dbError.message
    });
  }
}
```

## Current Connection Status

Your hardcoded DATABASE_URL in `/api/config/env.ts`:
```
postgresql://neondb_owner:npg_aJ8wfM4RIeTQ@ep-floral-leaf-ag3dpaau-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

## Diagnosing Connection Issues

### Step 1: Check Vercel Logs
After deploying, check your Vercel function logs for:

```
🔌 Initializing Neon serverless database connection...
📍 Connection URL present: true
📍 Connection URL (masked): postgresql://neondb_owner:****@ep-floral-leaf-ag3dpaau-pooler.c-2.eu-central-1.aws.neon.tech/neondb
🌐 Environment: Vercel Production
✅ Neon serverless database pool initialized and tested
```

**If you see:**
- ✅ "initialized and tested" → Database is reachable
- ❌ "connection test failed" → Check the error message

### Step 2: Check Browser Console
Open your deployed app and check the console:

**Connected:**
```
🟢 Neon DB Connected: {
  dbTimestamp: "2026-03-10T...",
  timestamp: "2026-03-10T..."
}
```

**Disconnected:**
```
🔴 Neon DB Offline: {
  status: 'error',
  database: 'disconnected',
  error: 'Connection timeout',
  message: 'Database connection failed'
}
```

### Step 3: Common Issues & Solutions

#### Issue 1: "Connection timeout"
**Cause:** Neon database is suspended or offline
**Solution:** 
1. Go to Neon console: https://console.neon.tech
2. Check if your database is active
3. If suspended, wake it up by running a query in the SQL Editor
4. Wait 30 seconds for auto-reconnect

#### Issue 2: "password authentication failed"
**Cause:** Database password changed or incorrect
**Solution:**
1. Get new connection string from Neon console
2. Update `/api/config/env.ts` with new DATABASE_URL
3. Redeploy to Vercel

#### Issue 3: "database does not exist"
**Cause:** Database name is incorrect
**Solution:**
1. Verify database name in Neon console
2. Update DATABASE_URL if needed
3. Ensure database name is `neondb` (as in your connection string)

#### Issue 4: SSL/TLS errors
**Cause:** SSL mode issues
**Solution:**
Connection string must end with `?sslmode=require`
Your current string is correct ✅

#### Issue 5: "ENOTFOUND" or "getaddrinfo failed"
**Cause:** DNS resolution failed
**Solution:**
1. Check if Vercel can reach external databases
2. Verify the endpoint URL is correct
3. Try pinging the database host from a terminal

### Step 4: Test Connection Manually

#### From Vercel (Production)
1. Deploy your app
2. Visit: `https://your-app.vercel.app/api?endpoint=health`
3. Should see:
```json
{
  "status": "ok",
  "database": "connected",
  "message": "Skyway Suites API is running",
  "timestamp": "2026-03-10T...",
  "dbTimestamp": "2026-03-10T..."
}
```

#### If Database Offline:
```json
{
  "status": "error",
  "database": "disconnected",
  "message": "Database connection failed",
  "error": "[Detailed error message here]",
  "timestamp": "2026-03-10T..."
}
```

### Step 5: Environment Variables

Even though you hardcoded the DATABASE_URL, you can override it in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `DATABASE_URL` = `[your connection string]`
3. Redeploy

**Priority:**
1. Vercel Environment Variable (if set)
2. Hardcoded value in `/api/config/env.ts` (fallback)

## Testing Database Operations

### Create a Test Property
Once connected, test write operations:

1. Go to Admin → Properties
2. Click "Add Property"
3. Fill out the form
4. Click "Create Property"

**Expected:**
- Success toast: "Property created!"
- New property appears in the table
- Check Vercel logs for SQL INSERT

### Check for Errors
If write fails:
- Check browser console
- Check Vercel function logs
- Look for SQL errors (table doesn't exist, permission denied, etc.)

## Database Schema Setup

If your Neon database is empty, you need to create tables first:

```sql
-- Run this in Neon SQL Editor

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  location VARCHAR(255),
  bedrooms INTEGER,
  bathrooms INTEGER,
  guests INTEGER,
  category VARCHAR(100),
  image TEXT,
  amenities TEXT[],
  available BOOLEAN DEFAULT true,
  ical_export_url TEXT,
  airbnb_import_url TEXT,
  booking_import_url TEXT,
  vrbo_import_url TEXT,
  calendar_sync_enabled BOOLEAN DEFAULT false,
  last_calendar_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, key)
);

-- Create admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role) 
VALUES (
  'admin@skyway.com',
  '$2b$10$rX8vF5pKpZvKxZ8vF5pKpuZvKxZ8vF5pKpZvKxZ8vF5pKpZvKxZ8v',
  'Admin User',
  'admin'
) ON CONFLICT DO NOTHING;
```

## Current Status Indicator Behavior

### In Development (Figma Make Preview)
- Shows: **"Neon DB Connected"** (green)
- Message: "Development Mode"
- API not actually called (preview mode)

### In Production (Vercel)
- Shows real connection status
- Updates every 30 seconds
- Logs to console for debugging

## Deployment Checklist

Before deploying to Vercel:

- [ ] Database tables created in Neon
- [ ] DATABASE_URL is correct in `/api/config/env.ts`
- [ ] Admin user created
- [ ] Test health endpoint locally if possible
- [ ] Deploy to Vercel
- [ ] Check Vercel function logs
- [ ] Visit `/api?endpoint=health` to test
- [ ] Watch connection indicator on frontend
- [ ] Test CRUD operations (Create, Read, Update, Delete)

## Getting Help

If still having issues:

1. **Check Vercel Function Logs** (most important)
   - Go to Vercel Dashboard → Deployments → Click deployment → Functions tab
   - Look for errors in the logs

2. **Check Neon Status**
   - Visit: https://neon.tech/docs/introduction/status
   - Verify no outages

3. **Test Connection String**
   - Use a database client (TablePlus, pgAdmin, psql)
   - Try connecting with your DATABASE_URL directly

4. **Console Logging**
   - All connection attempts are logged
   - Check browser console AND Vercel logs

## Success Indicators

✅ You'll know it's working when:
- Status indicator shows "Neon DB Connected" (green)
- Can create properties in admin
- Properties appear in the list
- Bookings can be created
- No errors in Vercel logs
- Health endpoint returns database timestamp
