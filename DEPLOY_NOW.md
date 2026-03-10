# 🚀 Deploy to Vercel NOW - Quick Guide

## The Problem You're Seeing

You're getting a **404 error** when accessing `/api/health-simple` because:

1. You're running the regular Vite dev server (`npm run dev`)
2. The Vite dev server only serves the React frontend
3. The `/api/*` routes are Vercel serverless functions
4. Serverless functions only work on Vercel (or with `vercel dev` locally)

## The Solution

Deploy to Vercel! It takes 2 minutes.

---

## Option A: Deploy via Vercel CLI (Fastest)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login

```bash
vercel login
```

This will open your browser to authenticate.

### Step 3: Deploy

```bash
vercel --prod
```

That's it! After ~30 seconds, you'll get a URL like:
```
✅ Production: https://skyway-suites-abc123.vercel.app
```

### Step 4: Test

Visit these URLs (replace with your actual URL):

```
https://skyway-suites-abc123.vercel.app/
https://skyway-suites-abc123.vercel.app/api/health-simple
https://skyway-suites-abc123.vercel.app/api/health
```

---

## Option B: Deploy via GitHub

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Fix serverless functions with Neon driver"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New Project**
3. Import your GitHub repository
4. Click **Deploy**

### Step 3: Test

Vercel will give you a URL after deployment:
```
https://your-repo-name.vercel.app
```

Test the endpoints:
```
https://your-repo-name.vercel.app/api/health-simple
https://your-repo-name.vercel.app/api/health
```

---

## After Deployment

### 1. Check the Health Endpoints

**Simple health (no database):**
```bash
curl https://your-app.vercel.app/api/health-simple
```

Should return:
```json
{
  "status": "ok",
  "message": "API is running",
  "timestamp": "2026-03-10T..."
}
```

**Full health (with database):**
```bash
curl https://your-app.vercel.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "database": "connected",
  "message": "Skyway Suites API is running"
}
```

### 2. Check the Database Status Indicator

1. Open your deployed site in a browser
2. Look at the **bottom-left corner**
3. You should see a **pulsing green dot** if database is connected
4. Hover over it to see details

### 3. Check Vercel Function Logs

If something doesn't work:

1. Go to [vercel.com](https://vercel.com)
2. Click on your project
3. Go to **Deployments**
4. Click on the latest deployment
5. Click **Functions** tab
6. Click on `/api/health`
7. Check the logs for errors

---

## Common Issues After Deployment

### Issue 1: Database shows disconnected (red dot)

**Cause:** Neon database is suspended (free tier auto-suspends)

**Fix:**
1. Go to [neon.tech](https://neon.tech)
2. Open your database dashboard
3. The database will wake up when you access it
4. Refresh your app after 10 seconds

### Issue 2: /api/health returns 500 error

**Cause:** Missing environment variables or database issue

**Fix:**
1. Go to Vercel → Project → Settings → Environment Variables
2. Add:
   ```
   DATABASE_URL=postgresql://...your-connection-string...
   JWT_SECRET=skyway-suites-secret-key-2026-production-change-this
   ```
3. Redeploy: `vercel --prod`

### Issue 3: "Cannot find module @neondatabase/serverless"

**Cause:** Dependencies not installed

**Fix:**
1. Check `package.json` has `"@neondatabase/serverless": "^1.0.2"` in dependencies
2. Commit and push again
3. Or redeploy: `vercel --prod --force`

---

## Testing Locally (Optional)

If you want to test API routes locally BEFORE deploying:

```bash
# Install Vercel CLI
npm install -g vercel

# Run Vercel dev server (includes API routes)
vercel dev
```

Then visit:
```
http://localhost:3000/api/health-simple
http://localhost:3000/api/health
```

**Note:** Regular `npm run dev` will NOT work for API routes!

---

## What We Fixed

Your original error was **FUNCTION_INVOCATION_FAILED** because:

1. ❌ Using `pg` package (needs native bindings, doesn't work in serverless)
2. ❌ Missing `.js` extensions on imports (required for ES modules)
3. ❌ `channel_binding=require` in DATABASE_URL (not supported)

Now it's fixed:

1. ✅ Using `@neondatabase/serverless` (works perfectly in Vercel)
2. ✅ All imports have `.js` extensions
3. ✅ Clean connection string with just `sslmode=require`

---

## Summary

**To fix the 404 error you're seeing:**

1. **Don't test locally with `npm run dev`** - API routes won't work
2. **Deploy to Vercel:** `vercel --prod`
3. **Test on Vercel URL:** `https://your-app.vercel.app/api/health-simple`

Or:

1. **Use Vercel dev:** `vercel dev`
2. **Test locally:** `http://localhost:3000/api/health-simple`

---

## Need Help?

Check these files:
- `/TESTING_GUIDE.md` - Complete testing guide
- `/VERCEL_DEPLOYMENT_FIX.md` - Detailed explanation of fixes
- `/LOCAL_DEVELOPMENT.md` - How to run locally

Or check Vercel function logs for specific errors.

---

## Ready? Let's Deploy!

```bash
vercel --prod
```

🎉 Your app will be live in ~30 seconds!
