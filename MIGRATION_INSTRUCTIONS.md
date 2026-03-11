# Database Migration Instructions - Merge Customers into Users

## Overview
This migration consolidates the `customers` table into the `users` table, simplifying the database structure. All customers will now be users with `role = 'customer'`.

## Changes Made

### Backend API (`/api/index.ts`)
- ✅ Updated signup endpoint to only create users (with phone field)
- ✅ Customers endpoint now queries users table with `role = 'customer'`
- ✅ Reviews endpoints now join with users table instead of customers
- ✅ All customer operations now use users table

### Frontend
- ✅ Create account form now includes phone number field
- ✅ Phone number is required during signup
- ✅ AuthContext updated to pass phone to signup API

### Database Schema
- ✅ Users table will have `phone` column added
- ✅ Customers table will be dropped
- ✅ All foreign keys (bookings, payments, reviews) will reference users.id

## Migration Steps

### Step 1: Run the Migration Script

**IMPORTANT:** Run this script in your Neon database SQL Editor:

```sql
-- Copy and paste the contents of /MERGE_CUSTOMERS_TO_USERS.sql
```

This script will:
1. Add `phone` column to users table
2. Migrate existing customer data to users table
3. Update all foreign key references (bookings, payments, reviews)
4. Drop the customers table
5. Create index on phone column

### Step 2: Verify Migration Success

Run these verification queries in Neon:

```sql
-- Check all customers are now in users table
SELECT COUNT(*) as total_customers FROM users WHERE role = 'customer';

-- Verify phone numbers were migrated
SELECT COUNT(*) as users_with_phone FROM users WHERE phone IS NOT NULL AND role = 'customer';

-- Check bookings are properly linked
SELECT COUNT(*) as booking_count FROM bookings b
JOIN users u ON b.customer_id = u.id
WHERE u.role = 'customer';

-- Verify customers table is dropped
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'customers';
-- This should return 0 rows
```

### Step 3: Deploy Updated Code

After running the migration script:
1. Deploy the updated backend API to Vercel
2. The frontend changes will automatically work with the new structure

### Step 4: Test the System

1. **Test New Account Creation:**
   - Go to Create Account page
   - Fill in all fields including phone number
   - Submit and verify account is created
   - Check database: `SELECT * FROM users WHERE role = 'customer' ORDER BY created_at DESC LIMIT 1;`

2. **Test Existing Users:**
   - Login with an existing customer account
   - Verify booking functionality works
   - Check that customer profile shows correctly

3. **Test Admin Panel:**
   - Go to Admin → Customers
   - Verify customer list displays correctly
   - Test editing a customer (name, email, phone)

## Rollback Plan (If Needed)

If you need to rollback, you must have a database backup. There is no automatic rollback for this migration.

**Prevention:** Take a Neon database backup BEFORE running the migration:
- In Neon Console → Select your database → Backups → Create Backup

## Benefits of This Change

1. **Simplified Schema:** One user table instead of two separate tables
2. **Easier Authentication:** All users (customers and admins) in one place
3. **Better Data Integrity:** No need to sync between users and customers
4. **Cleaner Code:** Fewer database queries and joins
5. **Consistent Role Management:** All users have roles (customer/admin)

## Notes

- All existing bookings, payments, and reviews will continue to work
- Customer IDs remain the same (they're now user IDs)
- Phone numbers are now required for new signups
- Existing users who sign up before migration will have their phone numbers migrated if they exist in the old customers table

## Support

If you encounter any issues:
1. Check the verification queries above
2. Review the Neon database logs
3. Check the Vercel function logs for API errors
