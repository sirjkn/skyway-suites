-- ============================================
-- FIX BOOKING SCHEMA - Use Users Table Instead of Customers
-- ============================================
-- This script fixes the booking functionality by changing
-- the foreign key from customers table to users table
-- ============================================

-- Step 1: Drop existing foreign key constraint on bookings table
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;

-- Step 2: Add new foreign key constraint to users table
ALTER TABLE bookings 
ADD CONSTRAINT bookings_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 3: Do the same for payments table
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_customer_id_fkey;

ALTER TABLE payments 
ADD CONSTRAINT payments_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this query to verify the foreign keys are updated:

SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (tc.table_name = 'bookings' OR tc.table_name = 'payments')
ORDER BY tc.table_name;

-- ============================================
-- SUCCESS!
-- ============================================
-- Bookings and payments now reference the users table
-- Users can now create bookings directly after login
-- No need for separate customer records
-- ============================================
