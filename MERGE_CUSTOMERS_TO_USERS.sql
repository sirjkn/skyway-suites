-- Migration: Merge customers table into users table
-- This script consolidates customer data into the users table

-- Step 1: Add phone column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Step 2: Migrate existing customers data to users table
-- For customers that already have user accounts (matched by email), update their phone
UPDATE users u
SET phone = c.phone
FROM customers c
WHERE u.email = c.email 
AND u.phone IS NULL;

-- Step 3: For customers without user accounts, create user records
-- (This should be rare since signup creates both, but handles edge cases)
INSERT INTO users (id, email, name, phone, role, password_hash)
SELECT 
  c.id,
  c.email,
  c.name,
  c.phone,
  'customer' AS role,
  '' AS password_hash  -- Empty password hash - these users will need to reset password
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.email = c.email
)
ON CONFLICT (email) DO NOTHING;

-- Step 4: Update bookings table to use user IDs
-- This ensures all bookings reference the correct user
UPDATE bookings b
SET customer_id = u.id
FROM customers c
JOIN users u ON u.email = c.email
WHERE b.customer_id = c.id
AND b.customer_id != u.id;

-- Step 5: Update payments table to use user IDs
UPDATE payments p
SET customer_id = u.id
FROM customers c
JOIN users u ON u.email = c.email
WHERE p.customer_id = c.id
AND p.customer_id != u.id;

-- Step 6: Update reviews table to use user IDs
UPDATE reviews r
SET customer_id = u.id
FROM customers c
JOIN users u ON u.email = c.email
WHERE r.customer_id = c.id
AND r.customer_id != u.id;

-- Step 7: Drop the customers table (we no longer need it)
DROP TABLE IF EXISTS customers;

-- Step 8: Add index on phone column for better performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Verification queries (run these to confirm migration success)
-- SELECT COUNT(*) as total_users FROM users WHERE role = 'customer';
-- SELECT COUNT(*) as bookings_count FROM bookings;
-- SELECT COUNT(*) as users_with_phone FROM users WHERE phone IS NOT NULL;
