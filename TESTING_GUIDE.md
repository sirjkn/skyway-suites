# Testing Guide - Skyway Suites

## 🚨 Important: Where to Test API Routes

Your `/api/*` routes are **Vercel serverless functions** and will NOT work with the regular Vite dev server.

### ❌ This Won't Work
```bash
npm run dev
# Then visiting http://localhost:5173/api/health
# Result: 404 error from React Router
```

### ✅ Option 1: Test on Vercel (Recommended)

**Deploy to Vercel first:**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod
```

**Then test your live URLs:**
```
https://your-app.vercel.app/
https://your-app.vercel.app/api/health-simple
https://your-app.vercel.app/api/health
```

### ✅ Option 2: Use Vercel Dev Locally

```bash
# First time setup
vercel login
vercel link
vercel env pull

# Run Vercel dev server (includes API routes)
npm run dev:vercel

# Or directly
vercel dev
```

**Then test locally:**
```
http://localhost:3000/
http://localhost:3000/api/health-simple
http://localhost:3000/api/health
```

## Quick Start for Testing

### 1. Deploy to Vercel Now

```bash
# One command to deploy
vercel --prod
```

### 2. Get Your Deployment URL

After deployment completes, you'll see:
```
✅ Production: https://your-app-abc123.vercel.app [1s]
```

### 3. Test These Endpoints

Open in your browser or use curl:

**Simple Health Check (no database):**
```bash
curl https://your-app-abc123.vercel.app/api/health-simple
```

Expected response:
```json
{
  "status": "ok",
  "message": "API is running",
  "timestamp": "2026-03-10T...",
  "environment": "production"
}
```

**Full Health Check (with database):**
```bash
curl https://your-app-abc123.vercel.app/api/health
```

Expected response if DB connected:
```json
{
  "status": "ok",
  "database": "connected",
  "message": "Skyway Suites API is running",
  "dbTime": "2026-03-10...",
  "dbVersion": "PostgreSQL 16"
}
```

**Home Page:**
```bash
# Just visit in browser
https://your-app-abc123.vercel.app/
```

## What's Fixed

✅ Switched from `pg` to `@neondatabase/serverless` (works in Vercel)
✅ Fixed all ES module imports (added `.js` extensions)
✅ Removed incompatible `channel_binding=require` from DATABASE_URL
✅ Added explicit Node.js runtime to vercel.json
✅ Created simple health check for basic testing

## Checking Database Status

### On Your Live Site

1. Visit your Vercel deployment URL
2. Look at the bottom-left corner of the page
3. You'll see a pulsing dot:
   - 🟢 **Green** = Connected to Neon database
   - 🔴 **Red** = Disconnected
   - ⚪ **Gray** = Checking connection
4. Hover over the dot for details

### Via API

```bash
curl https://your-app-abc123.vercel.app/api/health
```

Look for `"database": "connected"` in the response.

## Troubleshooting

### Issue: Can't access /api routes locally

**Solution:** Use `vercel dev` instead of `npm run dev`

### Issue: Vercel deployment succeeds but API returns 500

**Check:**
1. Go to Vercel Dashboard → Your Project
2. Click **Functions** tab
3. Click on `/api/health` function
4. Check the **Logs** for errors

**Common errors:**
- "Cannot find module" → Dependencies not installed correctly
- "Connection timeout" → Neon database suspended
- "SSL error" → Wrong DATABASE_URL format

### Issue: Database shows disconnected

**Possible causes:**

1. **Neon database suspended** (free tier auto-suspends)
   - Go to Neon dashboard
   - Click on your database
   - It should wake up automatically

2. **Wrong DATABASE_URL**
   - Check Vercel environment variables
   - Must use `-pooler` endpoint
   - Must have `sslmode=require`
   - Example: `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require`

3. **Tables don't exist**
   - Run the setup SQL in Neon dashboard
   - See `QUICK_DATABASE_SETUP.sql`

### Issue: "FUNCTION_INVOCATION_FAILED"

This was the original error you had. It's now fixed by:
- Using Neon serverless driver instead of regular `pg`
- Adding `.js` extensions to imports
- Removing `channel_binding` parameter

If you still see this:
- Redeploy: `vercel --prod --force`
- Check function logs in Vercel dashboard
- Verify `@neondatabase/serverless` is in package.json dependencies

## Environment Variables on Vercel

Even though values are hardcoded, set them in Vercel:

1. Go to **Vercel Dashboard** → Your Project
2. **Settings** → **Environment Variables**
3. Add:

```
DATABASE_URL = postgresql://neondb_owner:npg_aJ8wfM4RIeTQ@ep-floral-leaf-ag3dpaau-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require

JWT_SECRET = skyway-suites-secret-key-2026-production-change-this
```

4. Select: ✅ Production ✅ Preview ✅ Development
5. Click **Save**
6. **Redeploy** the application

## Commands Cheat Sheet

```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel

# Deploy with fresh build
vercel --prod --force

# Run locally with API routes
vercel dev

# Run locally (frontend only, no API)
npm run dev

# View deployment logs
vercel logs

# Pull environment variables
vercel env pull

# Check deployment status
vercel ls
```

## Success Checklist

- [ ] Deployed to Vercel successfully
- [ ] `/api/health-simple` returns 200 OK
- [ ] `/api/health` returns 200 OK with "database": "connected"
- [ ] Frontend shows green pulsing dot (bottom-left corner)
- [ ] Can load the home page
- [ ] Can navigate to different pages
- [ ] Can log in with admin@test.com / admin123 (if user exists in DB)

## Next Steps After Successful Deployment

1. ✅ Verify database connection (green dot)
2. ✅ Test admin login
3. ✅ Create/edit properties in admin panel
4. ✅ Test booking flow
5. ✅ Verify all pages load correctly

## Files to Review

- `/VERCEL_DEPLOYMENT_FIX.md` - Detailed explanation of fixes
- `/LOCAL_DEVELOPMENT.md` - How to run locally with Vercel dev
- `/api/health-simple.ts` - Simple API test endpoint
- `/api/health.ts` - Full health check with database

---

**TL;DR:** Deploy to Vercel with `vercel --prod`, then test at `https://your-app.vercel.app/api/health-simple`
