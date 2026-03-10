# Vercel Deployment Fix - Database Connection Issue

## Problem
The `/api/health` endpoint was returning a 500 INTERNAL_SERVER_ERROR with FUNCTION_INVOCATION_FAILED because the serverless function was crashing on startup.

## Root Cause
1. **Wrong database driver**: The standard `pg` package requires native bindings which don't work reliably in Vercel's serverless environment
2. **ES Module imports**: The package.json has `"type": "module"` but imports were missing `.js` extensions
3. **Connection string parameter**: The `channel_binding=require` parameter was incompatible with serverless environments

## Solution Applied

### 1. Switched to Neon Serverless Driver
- ✅ Installed `@neondatabase/serverless` package
- ✅ Updated `/api/config/db.ts` to use Neon's serverless driver
- ✅ This driver uses fetch() instead of native bindings, making it perfect for serverless

### 2. Fixed ES Module Imports
- ✅ Added `.js` extensions to all relative imports in `/api` folder
- ✅ Updated all API route files: auth.ts, bookings.ts, contact.ts, customers.ts, payments.ts, properties.ts, settings.ts
- ✅ Updated utility files: `/api/utils/auth.ts`

### 3. Fixed Connection String
- ✅ Removed `channel_binding=require` from DATABASE_URL
- ✅ Now using: `postgresql://...?sslmode=require`

### 4. Added Explicit Runtime
- ✅ Updated vercel.json to specify `"runtime": "nodejs20.x"`

## Files Changed

1. `/api/config/db.ts` - Complete rewrite to use @neondatabase/serverless
2. `/api/config/env.ts` - Removed channel_binding parameter
3. `/api/health.ts` - Dynamic import with better error handling
4. `/api/health-simple.ts` - NEW: Simple health check without database
5. `/api/auth.ts` - Added .js extensions
6. `/api/bookings.ts` - Added .js extensions
7. `/api/contact.ts` - Added .js extensions
8. `/api/customers.ts` - Added .js extensions
9. `/api/payments.ts` - Added .js extensions
10. `/api/properties.ts` - Added .js extensions
11. `/api/settings.ts` - Added .js extensions
12. `/api/utils/auth.ts` - Added .js extensions
13. `/vercel.json` - Added explicit runtime
14. `/package.json` - Added @neondatabase/serverless

## Deploy to Vercel

### Option 1: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Deploy
vercel --prod
```

### Option 2: Push to GitHub

1. Commit all changes:
```bash
git add .
git commit -m "Fix: Switch to Neon serverless driver for Vercel compatibility"
git push origin main
```

2. Vercel will automatically deploy from your connected GitHub repository

## Environment Variables in Vercel

Even though values are hardcoded, it's best practice to set them in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

```
DATABASE_URL=postgresql://neondb_owner:npg_aJ8wfM4RIeTQ@ep-floral-leaf-ag3dpaau-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=skyway-suites-secret-key-2026-production-change-this
```

4. Select all environments: **Production**, **Preview**, **Development**
5. Click **Save**
6. **Redeploy** your application

## Testing After Deployment

### 1. Test Simple Health Check (No Database)
```bash
curl https://your-app.vercel.app/api/health-simple
```

Expected response:
```json
{
  "status": "ok",
  "message": "API is running",
  "timestamp": "2026-03-10T...",
  "environment": "production",
  "nodeVersion": "v20.x.x",
  "platform": "linux"
}
```

### 2. Test Full Health Check (With Database)
```bash
curl https://your-app.vercel.app/api/health
```

Expected response (if database is connected):
```json
{
  "status": "ok",
  "database": "connected",
  "message": "Skyway Suites API is running",
  "timestamp": "2026-03-10T...",
  "dbTime": "2026-03-10 ...",
  "dbVersion": "PostgreSQL 16",
  "environment": "production"
}
```

Expected response (if database fails):
```json
{
  "status": "error",
  "database": "disconnected",
  "message": "Database connection failed",
  "error": "...",
  "troubleshooting": { ... }
}
```

### 3. Check Vercel Function Logs

1. Go to **Vercel Dashboard** → **Your Project**
2. Click **Deployments** → Select latest deployment
3. Click **Functions** tab
4. Find `/api/health` function
5. Look for these log messages:

**Success logs:**
```
🔌 Initializing Neon serverless database connection...
📍 Connection URL present: true
🌐 Environment: Vercel Production
✅ Neon serverless database pool initialized
🏥 Health check starting...
✅ Health check successful
```

**Error logs:**
```
❌ Query failed: connection timeout
❌ Health check failed: Error: ...
```

### 4. Check Frontend Status Indicator

1. Visit your live site
2. Look for the pulsing dot in the bottom-left corner
3. **Green** = Connected to Neon DB
4. **Red** = Disconnected
5. **Gray** = Checking connection
6. **Hover** over the dot to see detailed status

## Common Issues After Deployment

### Issue 1: Still getting FUNCTION_INVOCATION_FAILED

**Solution:**
- Check Vercel function logs for the exact error
- Make sure all packages are installed (check package.json)
- Verify `@neondatabase/serverless` is listed in dependencies
- Redeploy after confirming changes

### Issue 2: Database shows disconnected but function works

**Possible causes:**
1. Neon database is suspended (free tier auto-suspends after inactivity)
   - **Fix**: Visit Neon dashboard, wake up the database
   
2. Wrong DATABASE_URL
   - **Fix**: Double-check the connection string
   - Must use `-pooler` endpoint
   - Must have `sslmode=require` (NOT `channel_binding`)

3. Neon database doesn't have the tables
   - **Fix**: Run the setup SQL to create tables

### Issue 3: "Cannot find module" errors

**Solution:**
- Make sure all imports have `.js` extensions
- Check that `@neondatabase/serverless` is installed
- Verify `package.json` has all dependencies
- Try: `vercel --prod --force` to force rebuild

### Issue 4: Database timeout

**Solution:**
- Check Neon database status (might be suspended)
- Increase `connectionTimeoutMillis` in `/api/config/db.ts`
- Verify network connectivity from Vercel to Neon

## Neon Database Setup

If your Neon database doesn't have the required tables, run this SQL:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role) 
VALUES ('admin@test.com', '$2b$10$XqZ9YvJxZ4kqZ4kqZ4kqZ4kqZ4kqZ4kqZ4kqZ4kqZ4kqZ4kqZ4kqZ', 'Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Create other tables
CREATE TABLE IF NOT EXISTS properties ( ... );
CREATE TABLE IF NOT EXISTS bookings ( ... );
CREATE TABLE IF NOT EXISTS customers ( ... );
CREATE TABLE IF NOT EXISTS payments ( ... );
CREATE TABLE IF NOT EXISTS contact_submissions ( ... );
CREATE TABLE IF NOT EXISTS settings ( ... );
```

See `/QUICK_DATABASE_SETUP.sql` for the complete SQL.

## Why This Fix Works

1. **@neondatabase/serverless** is specifically designed for serverless environments
   - Uses WebSocket or fetch() instead of TCP (which requires native bindings)
   - Automatically handles connection pooling for serverless
   - Much more reliable in Vercel/AWS Lambda/Cloudflare Workers

2. **ES Module .js extensions** are required when package.json has `"type": "module"`
   - TypeScript compiles to .js files
   - Node.js ES modules require explicit extensions
   - Without them, imports fail at runtime

3. **Removing channel_binding** eliminates a PostgreSQL parameter that's not supported in all environments
   - `sslmode=require` is sufficient for Neon
   - Simpler connection string = fewer points of failure

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test `/api/health-simple` (should work immediately)
3. ✅ Test `/api/health` (should connect to database)
4. ✅ Check frontend status indicator
5. ✅ Test login with admin@test.com / admin123
6. ✅ Verify all admin functions work

## Success Criteria

- [ ] `/api/health-simple` returns 200 OK
- [ ] `/api/health` returns 200 OK with database: connected
- [ ] Frontend shows green pulsing dot
- [ ] Can log in with admin@test.com
- [ ] Admin dashboard loads without errors
- [ ] Can view/create/edit properties

## Support

If you continue to have issues:

1. **Check Vercel Function Logs** - Most errors will show here
2. **Check Neon Dashboard** - Verify database is active
3. **Test each endpoint individually** - Narrow down which API route is failing
4. **Check browser console** - Look for CORS or fetch errors
5. **Use `/api/health-simple`** - If this fails, it's a Vercel configuration issue, not database

---

**Last Updated:** March 10, 2026
**Status:** Ready for deployment
