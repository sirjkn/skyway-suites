-- =============================================
-- SYNC EXISTING USERS TO CUSTOMERS TABLE
-- =============================================
-- This migration ensures all users have corresponding customer records
-- Run this in your Neon SQL Editor

-- Insert users into customers table if they don't already exist
-- This will sync existing users so they can create bookings
INSERT INTO customers (id, email, name, phone)
SELECT 
  u.id,
  u.email,
  u.name,
  NULL as phone  -- Phone is optional
FROM users u
WHERE u.role = 'customer'  -- Only sync customer accounts, not admin
  AND NOT EXISTS (
    SELECT 1 FROM customers c WHERE c.id = u.id
  );

-- Verify the sync
SELECT 
  COUNT(*) as total_users,
  COUNT(DISTINCT c.id) as users_with_customer_record
FROM users u
LEFT JOIN customers c ON u.id = c.id
WHERE u.role = 'customer';

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Users synced to customers table!';
    RAISE NOTICE 'All customer users now have corresponding customer records for bookings.';
END $$;
