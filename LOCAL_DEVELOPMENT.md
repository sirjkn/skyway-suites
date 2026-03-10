# Local Development Guide

## Important: API Routes Only Work on Vercel

The `/api/*` serverless functions are **Vercel-specific** and only work when:
1. Deployed to Vercel (production/preview)
2. Running with Vercel CLI locally

They **DO NOT work** with the regular Vite dev server (`npm run dev`).

## Option 1: Test on Vercel Directly (Recommended)

This is the fastest way to test since your app is already configured for Vercel.

### Deploy to Vercel

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel (if you haven't)
vercel login

# Deploy to production
vercel --prod
```

### Or Deploy via GitHub

1. Push your code to GitHub:
```bash
git add .
git commit -m "Fix serverless functions for Vercel"
git push origin main
```

2. Vercel will auto-deploy if your repo is connected

### Test on Vercel

Once deployed, test these URLs:

```
https://your-app.vercel.app/api/health-simple
https://your-app.vercel.app/api/health
https://your-app.vercel.app/
```

## Option 2: Local Development with Vercel CLI

To test API routes locally, use Vercel's development server:

### Setup

```bash
# Install Vercel CLI (if you haven't)
npm install -g vercel

# Link your project to Vercel (first time only)
vercel link

# Download environment variables from Vercel (first time only)
vercel env pull
```

### Run Development Server

Instead of `npm run dev`, use:

```bash
vercel dev
```

This starts a local Vercel environment that:
- ✅ Runs your Vite frontend
- ✅ Runs your `/api/*` serverless functions
- ✅ Loads environment variables
- ✅ Simulates the Vercel production environment

### Access Your App

```
Frontend: http://localhost:3000
API: http://localhost:3000/api/health
```

## Option 3: Use Mock Data (Frontend Only)

If you only want to test the frontend without API:

1. Update the API client to use mock data
2. Run the regular Vite server: `npm run dev`
3. All API calls will use mock responses

## Current Status

Your app is currently configured for **Vercel deployment only**. The serverless functions in `/api/*` require:

- Node.js runtime (provided by Vercel)
- Environment variables (set in Vercel dashboard)
- Neon database connection (configured for serverless)

## Recommended Workflow

### For Testing Features

1. Use `vercel dev` for local testing
2. Test API endpoints work
3. Test frontend interactions

### For Deployment

1. Test locally with `vercel dev`
2. Deploy to preview: `vercel`
3. Test preview deployment
4. Deploy to production: `vercel --prod`

## Troubleshooting

### "404 Not Found" for `/api/*` routes

**Cause:** Running Vite dev server instead of Vercel dev server

**Fix:** Use `vercel dev` instead of `npm run dev`

### "Cannot find module" errors with Vercel dev

**Cause:** Dependencies not installed

**Fix:**
```bash
npm install
vercel dev
```

### Environment variables not loading

**Cause:** Env vars not pulled from Vercel

**Fix:**
```bash
vercel env pull
vercel dev
```

### Database connection fails locally

**Cause:** DATABASE_URL not set or Neon database suspended

**Fix:**
1. Check `.env` file (created by `vercel env pull`)
2. Wake up Neon database from Neon dashboard
3. Verify connection string is correct

## Environment Variables

Even though values are hardcoded, it's better to use environment variables:

### Local (.env file created by `vercel env pull`)

```env
DATABASE_URL=postgresql://...
JWT_SECRET=skyway-suites-secret-key-2026-production-change-this
```

### Vercel (Dashboard → Settings → Environment Variables)

```
DATABASE_URL=postgresql://...
JWT_SECRET=skyway-suites-secret-key-2026-production-change-this
```

## Commands Quick Reference

```bash
# Local development with Vercel
vercel dev

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Pull environment variables
vercel env pull

# View logs
vercel logs

# List deployments
vercel ls

# Regular Vite dev (frontend only, no API)
npm run dev
```

## Why This Setup?

Your app uses Vercel-specific features:
- Serverless functions (`/api/*.ts` files)
- Automatic API routing
- Environment variables
- Neon serverless database integration

These features are **not available** with a standard Vite dev server. You need Vercel's infrastructure to run them.

## Next Steps

1. ✅ Install Vercel CLI: `npm install -g vercel`
2. ✅ Run locally: `vercel dev`
3. ✅ Test `/api/health-simple` at `http://localhost:3000/api/health-simple`
4. ✅ Deploy to production: `vercel --prod`
5. ✅ Test on live URL

---

**Bottom Line:** For API routes to work, use `vercel dev` locally or deploy to Vercel.
