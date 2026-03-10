# Live Database Connection Troubleshooting Guide

## Issue: Database shows disconnected (red indicator) on Vercel deployment

### What We Fixed

1. **Removed `channel_binding=require`** from the DATABASE_URL
   - This parameter can cause connection failures in serverless environments
   - Changed from: `...?sslmode=require&channel_binding=require`
   - Changed to: `...?sslmode=require`

2. **Enhanced error logging** in database connection
   - Added detailed console logs to track connection attempts
   - Added pool event handlers for better debugging
   - Added query timeout handling

3. **Improved health check endpoint**
   - Added 5-second timeout for database queries
   - Detailed error reporting with troubleshooting tips
   - Environment detection (production vs development)

4. **Enhanced frontend status indicator**
   - Shows detailed error messages when hovering
   - Better console logging for debugging
   - Clearer status messages

### Steps to Fix Connection on Vercel

#### 1. **Check Neon Database Status**
   - Go to your Neon console: https://console.neon.tech
   - Verify your database is **active** (not suspended or paused)
   - Check if there are any billing issues or plan limits reached

#### 2. **Verify Environment Variables in Vercel**
   Even though you've hardcoded the values, it's best practice to set them in Vercel:
   
   - Go to your Vercel project dashboard
   - Navigate to **Settings** → **Environment Variables**
   - Add these variables:
     ```
     DATABASE_URL=postgresql://neondb_owner:npg_aJ8wfM4RIeTQ@ep-floral-leaf-ag3dpaau-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
     JWT_SECRET=skyway-suites-secret-key-2026-production-change-this
     ```
   - Make sure they're enabled for **Production**, **Preview**, and **Development**
   - **Redeploy** your application after adding environment variables

#### 3. **Check Neon Connection String Format**
   Your current connection string should be:
   ```
   postgresql://neondb_owner:npg_aJ8wfM4RIeTQ@ep-floral-leaf-ag3dpaau-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   
   Important notes:
   - Must use the **pooler** endpoint (ends with `-pooler`)
   - Use `sslmode=require` (NOT `channel_binding=require`)
   - Username format: `neondb_owner` or `database_owner`

#### 4. **Verify Neon Database is Accessible**
   - In Neon console, check **Pooler** is enabled
   - Verify the database name is `neondb`
   - Check if there are any IP restrictions (Vercel should be allowed)
   - Make sure the database wasn't deleted or reset

#### 5. **Check Vercel Deployment Logs**
   - Go to your Vercel project
   - Click on **Deployments**
   - Select your latest deployment
   - Click **Functions** tab
   - Look for `/api/health` function logs
   - Check for connection errors:
     ```
     ❌ Unexpected database pool error: ...
     ❌ Query failed: ...
     ```

#### 6. **Test the Connection Directly**
   After deployment, test the health endpoint:
   ```bash
   curl https://your-app.vercel.app/api/health
   ```
   
   Expected response (success):
   ```json
   {
     "status": "ok",
     "database": "connected",
     "message": "Skyway Suites API is running",
     "timestamp": "2026-03-10T...",
     "dbTime": "...",
     "dbVersion": "PostgreSQL 16",
     "environment": "production"
   }
   ```
   
   Error response will include troubleshooting tips:
   ```json
   {
     "status": "error",
     "database": "disconnected",
     "error": "connection timeout",
     "troubleshooting": { ... }
   }
   ```

#### 7. **Common Issues and Solutions**

   **Issue: "Connection timeout"**
   - Solution: Check if Neon database is active (may be auto-suspended)
   - Solution: Increase connectionTimeoutMillis in db.ts
   - Solution: Verify network connectivity from Vercel to Neon

   **Issue: "Authentication failed"**
   - Solution: Double-check username and password in connection string
   - Solution: Verify user exists in Neon database
   - Solution: Reset database password in Neon console

   **Issue: "SSL/TLS error"**
   - Solution: Ensure `sslmode=require` is in the connection string
   - Solution: Verify `rejectUnauthorized: false` is in SSL config
   - Solution: Check Neon SSL certificate is valid

   **Issue: "Database not found"**
   - Solution: Verify database name is correct (`neondb`)
   - Solution: Check if database was deleted or renamed
   - Solution: Create database if it doesn't exist

   **Issue: "Too many connections"**
   - Solution: Check pool max size (currently 10)
   - Solution: Verify old connections are being closed
   - Solution: Consider using Neon's serverless driver

#### 8. **Alternative: Use Neon Serverless Driver**
   If standard `pg` continues to fail, consider using `@neondatabase/serverless`:
   
   ```bash
   npm install @neondatabase/serverless
   ```
   
   Then update `/api/config/db.ts`:
   ```typescript
   import { Pool } from '@neondatabase/serverless';
   ```

#### 9. **Enable Debug Logging**
   Check Vercel function logs for these messages:
   - ✅ "Database pool initialized with Neon PostgreSQL"
   - ✅ "New database client connected to Neon"
   - ❌ "Unexpected database pool error"
   - ❌ "Query failed"

#### 10. **Contact Neon Support**
   If all else fails:
   - Check Neon status page: https://status.neon.tech
   - Contact Neon support with your project ID
   - Verify your plan supports serverless connections

### Quick Checklist

- [ ] Neon database is active (not suspended)
- [ ] Using pooler endpoint (ends with `-pooler`)
- [ ] Connection string uses `sslmode=require` (NOT `channel_binding=require`)
- [ ] Environment variables set in Vercel (or hardcoded correctly)
- [ ] Application redeployed after changes
- [ ] `/api/health` endpoint returns 200 status
- [ ] No errors in Vercel function logs
- [ ] Database credentials are correct
- [ ] Neon project has no billing issues

### Expected Behavior After Fix

1. **In Figma Make Preview**: Green dot (mock connection, API not available)
2. **On Vercel (live)**: 
   - Green dot if database connected
   - Red dot if database disconnected
   - Hover over dot to see detailed status and error messages

### Console Logs to Look For

**Success:**
```
🔌 Initializing database connection to Neon...
📍 Connection URL present: true
🌐 Environment: Vercel Production
✅ Database pool initialized with Neon PostgreSQL
✅ New database client connected to Neon
🏥 Health check starting...
✅ Health check successful
```

**Failure:**
```
🔌 Initializing database connection to Neon...
❌ Unexpected database pool error: connection timeout
❌ Health check failed: Error: connection timeout
❌ Database disconnected: connection timeout
```

---

## Next Steps After Deployment

1. Deploy to Vercel
2. Wait for deployment to complete
3. Visit your live site
4. Check the database status indicator (bottom-left corner)
5. If red, hover over it to see the error message
6. Check Vercel function logs for detailed error information
7. Open browser console to see client-side logs
8. Visit `/api/health` directly to see server response

## Need More Help?

If the database is still showing as disconnected after trying all these steps, check:
1. Vercel function logs for the exact error message
2. Neon dashboard for database status
3. Browser console for frontend errors
4. `/api/health` endpoint response for detailed error information
