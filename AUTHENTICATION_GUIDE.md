# 🔐 Authentication Guide - Skyway Suites

## How Login Works

Your Skyway Suites app has **smart dual-mode authentication** that automatically adapts to the environment.

---

## 🎨 Preview Mode (Figma Make)

### URL Detection
The app automatically detects preview mode when the URL contains:
- `makeproxy` (Figma Make preview)
- `localhost` (local development)
- `figma.site` (Figma deployment)

### Login Behavior
```javascript
// Preview mode: Instant mock authentication
if (isPreviewMode()) {
  // ✅ ANY email works
  // ✅ ANY password works
  // ✅ Instant login (no API call)
  // ✅ Role based on email
}
```

### How It Works
1. **Enter any email** (e.g., `test@example.com`)
2. **Enter any password** (e.g., `anything`)
3. **Click Login** → Instant success! ✅

### Admin Access
To get admin role in preview mode:
- Use email containing "admin"
- Examples:
  - `admin@example.com` → Admin role ✅
  - `myadmin@test.com` → Admin role ✅
  - `john@example.com` → Customer role 👤

### What Happens
```
User enters credentials
    ↓
isPreviewMode() = true
    ↓
Create mock user object
    ↓
Save to localStorage
    ↓
Login successful! ✅
    ↓
Navigate to homepage
```

**No API calls, no database, no waiting!**

---

## 🚀 Production Mode (Vercel Deployment)

### URL Detection
The app enters production mode when:
- URL doesn't contain `makeproxy`, `localhost`, or `figma.site`
- Typically your custom domain or Vercel URL

### Login Behavior
```javascript
// Production mode: Real API authentication
if (!isPreviewMode()) {
  // ❌ Must use real credentials from database
  // ❌ Wrong password = Login failed
  // ✅ Validates against Neon database
  // ✅ Secure token-based auth
}
```

### How It Works
1. **Enter registered email** (from Neon database)
2. **Enter correct password** (hashed in database)
3. **Click Login** → API validates credentials
4. **Success** → Receive JWT token ✅
5. **Navigate** to homepage

### Authentication Flow
```
User enters credentials
    ↓
isPreviewMode() = false
    ↓
POST /api/auth?action=login
    ↓
Vercel serverless function
    ↓
Query Neon database
    ↓
Validate password hash
    ↓
Generate JWT token
    ↓
Return user + token
    ↓
Save to localStorage
    ↓
Login successful! ✅
```

### Creating Users in Production

**Option 1: Use Signup Page**
- Go to `/create-account`
- Enter email, password, and name
- Account created in Neon database

**Option 2: Run SQL Directly**
```sql
-- Connect to Neon database
-- Run this to create an admin user

INSERT INTO users (email, password_hash, name, role)
VALUES (
  'admin@skyway.com',
  '$2b$10$...',  -- Use bcrypt to hash password
  'Admin User',
  'admin'
);
```

**Option 3: Use Quick Setup Script**
- Check `QUICK_DATABASE_SETUP.sql`
- Creates default admin user:
  - Email: `admin@skyway.com`
  - Password: `admin123`

---

## 🔍 Troubleshooting

### Issue: "Login Failed" in Preview Mode
**Status:** ❌ Bug  
**Cause:** Preview mode detection failed  
**Solution:** 
- Check URL contains `makeproxy`, `localhost`, or `figma.site`
- Clear localStorage: `localStorage.clear()`
- Refresh page

### Issue: "Login Failed" in Production
**Status:** ⚠️ Expected  
**Cause:** Invalid credentials or no user in database  
**Solution:**
1. Check if user exists in Neon database:
   ```sql
   SELECT * FROM users WHERE email = 'your@email.com';
   ```
2. If no user exists, create one:
   - Use signup page
   - Run SQL INSERT
   - Use quick setup script
3. Verify password is correct
4. Check DATABASE_URL is set in Vercel

### Issue: Can't Access Admin Panel
**Status:** ⚠️ Role Issue  
**Cause:** User role is 'customer' not 'admin'  
**Solution:**

**Preview Mode:**
- Use email containing "admin" (e.g., `admin@test.com`)

**Production Mode:**
- Update role in database:
  ```sql
  UPDATE users 
  SET role = 'admin' 
  WHERE email = 'your@email.com';
  ```

### Issue: Logged Out After Refresh
**Status:** ⚠️ Storage Issue  
**Cause:** localStorage was cleared  
**Solution:**
- Login again
- Check browser doesn't clear localStorage automatically
- Verify not in incognito/private mode

---

## 🔐 Security Notes

### Preview Mode
- ⚠️ **NOT SECURE** - Anyone can login
- ⚠️ No password validation
- ⚠️ No user verification
- ✅ Perfect for demos and testing
- ✅ No real data exposed
- ✅ Safe for stakeholder presentations

### Production Mode
- ✅ **SECURE** - Real authentication
- ✅ Password hashing (bcrypt)
- ✅ JWT token validation
- ✅ Database user verification
- ✅ Protected API endpoints
- ⚠️ Remember: Not meant for PII or sensitive data

---

## 📋 Quick Reference

| Feature | Preview Mode | Production Mode |
|---------|--------------|-----------------|
| **URL** | `makeproxy`/`localhost`/`figma.site` | Custom domain |
| **Credentials** | Any email/password | Real credentials only |
| **Validation** | None | Database + password hash |
| **Speed** | Instant | ~200-500ms |
| **Admin Access** | Email contains "admin" | `role = 'admin'` in DB |
| **Security** | None (mock) | Full JWT + bcrypt |
| **Database** | Not used | Neon database required |
| **API Calls** | None | POST /api/auth |
| **Use Case** | Demos, testing, preview | Real users, production |

---

## 🧪 Testing Both Modes

### Test Preview Mode
1. Open Figma Make preview
2. Go to login page
3. Enter: `admin@test.com` / `anything`
4. Should login instantly ✅
5. Check console: "🔧 Preview mode: Using mock authentication"

### Test Production Mode
1. Deploy to Vercel
2. Set DATABASE_URL in environment variables
3. Run database setup
4. Create user via signup or SQL
5. Login with real credentials
6. Should receive JWT token ✅
7. Check console: "✅ Logged in with real API"

---

## 🎯 Best Practices

### For Demos (Preview Mode)
✅ Use email like `admin@demo.com` for admin access  
✅ Show stakeholders the UI/UX  
✅ Demonstrate all features  
✅ Explain preview mode is not secure  
✅ No need to remember passwords  

### For Production (Real Mode)
✅ Create strong passwords  
✅ Use real email addresses  
✅ Set up DATABASE_URL properly  
✅ Run database migrations  
✅ Test signup flow  
✅ Verify JWT tokens work  
✅ Monitor authentication logs  

---

## 🔄 Mode Switching

### From Preview → Production
1. Deploy code to Vercel
2. Set DATABASE_URL environment variable
3. Run `QUICK_DATABASE_SETUP.sql`
4. Create admin user
5. Login with real credentials
6. ✅ Now in production mode!

### From Production → Preview
1. Open Figma Make
2. URL changes to `makeproxy`
3. Automatically switches to mock auth
4. Login with any credentials
5. ✅ Now in preview mode!

**No code changes needed - automatic detection!**

---

## 📊 Console Messages

### Preview Mode
```javascript
🔧 Preview mode: Using mock authentication
✅ Logged in with mock data: admin
```

### Production Mode (Success)
```javascript
✅ Logged in with real API
```

### Production Mode (Error)
```javascript
Login error: Error: Invalid credentials
Login error: Error: User not found
Login error: Error: Database connection failed
```

---

## 🎉 Summary

Your authentication system is **smart** and **adaptive**:

✨ **Preview Mode:**
- Zero configuration
- Works immediately
- Perfect for demos
- Any credentials work

🔒 **Production Mode:**
- Full security
- Real database
- JWT tokens
- Password hashing

**Same code, two modes, automatic switching!**

---

**Current Status:** ✅ Login works in both modes  
**Last Updated:** March 10, 2026  
**Mode Detection:** Automatic via URL hostname
