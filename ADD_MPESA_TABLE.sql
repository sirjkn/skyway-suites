-- =============================================
-- ADD M-PESA TRANSACTIONS TABLE
-- =============================================
-- Copy and paste this entire script into your Neon SQL Editor and run it

-- Create M-Pesa transactions tracking table
CREATE TABLE IF NOT EXISTS mpesa_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_request_id VARCHAR(255) UNIQUE NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  mpesa_receipt_number VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mpesa_checkout_request ON mpesa_transactions(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_booking ON mpesa_transactions(booking_id);

-- Add transaction_id column to payments table if it doesn't exist
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255);

-- Create index on transaction_id
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);

-- Verify tables were created
SELECT 
  tablename, 
  COALESCE(
    (SELECT count(*) FROM information_schema.columns WHERE table_name = tablename),
    0
  ) as column_count
FROM pg_tables 
WHERE tablename IN ('mpesa_transactions', 'payments')
AND schemaname = 'public';

-- Success message
SELECT '✅ M-Pesa tables created successfully!' as status;
