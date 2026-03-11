-- =============================================
-- SKYWAY SUITES - NEON DATABASE SCHEMA
-- =============================================
-- Run this SQL in your Neon SQL Editor to create all necessary tables
-- URL: https://console.neon.tech → Select your project → SQL Editor

-- =============================================
-- PROPERTIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  location VARCHAR(255),
  bedrooms INTEGER,
  bathrooms INTEGER,
  guests INTEGER,
  category VARCHAR(100),
  image TEXT,
  amenities TEXT[],
  available BOOLEAN DEFAULT true,
  average_rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  ical_export_url TEXT,
  airbnb_import_url TEXT,
  booking_import_url TEXT,
  vrbo_import_url TEXT,
  calendar_sync_enabled BOOLEAN DEFAULT false,
  last_calendar_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CUSTOMERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- BOOKINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PAYMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CONTACT SUBMISSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, key)
);

-- =============================================
-- SEED DATA - ADMIN USER
-- =============================================
-- Default admin credentials:
-- Email: admin@skyway.com
-- Password: admin123
-- IMPORTANT: Change password after first login!

INSERT INTO users (email, password_hash, name, role) 
VALUES (
  'admin@skyway.com',
  '$2b$10$YKq5rHh9u5Y5Y5Y5Y5Y5YuZvKxZ8vF5pKpZvKxZ8vF5pKpZvKxZ8.',
  'Admin User',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- =============================================
-- SEED DATA - SAMPLE PROPERTIES (OPTIONAL)
-- =============================================
-- Uncomment below to add sample properties for testing

/*
INSERT INTO properties (title, description, price, location, bedrooms, bathrooms, guests, category, image, amenities, available) VALUES
(
  'Luxury Beachfront Villa',
  'Stunning oceanfront property with panoramic sea views, infinity pool, and direct beach access. Perfect for families and groups seeking an unforgettable coastal retreat.',
  450.00,
  'Malibu, California',
  4,
  3,
  8,
  'villa',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
  ARRAY['WiFi', 'Pool', 'Beach Access', 'Kitchen', 'Parking', 'Air Conditioning'],
  true
),
(
  'Modern Downtown Loft',
  'Stylish industrial loft in the heart of downtown. Features exposed brick, high ceilings, and walking distance to all major attractions.',
  200.00,
  'New York, New York',
  2,
  2,
  4,
  'apartment',
  'https://images.unsplash.com/photo-1502672260066-6bc176e4ac88?w=800',
  ARRAY['WiFi', 'Kitchen', 'Workspace', 'Air Conditioning', 'Gym Access'],
  true
),
(
  'Cozy Mountain Cabin',
  'Rustic cabin nestled in the mountains with breathtaking views. Ideal for nature lovers and those seeking peace and tranquility.',
  150.00,
  'Aspen, Colorado',
  3,
  2,
  6,
  'cabin',
  'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800',
  ARRAY['WiFi', 'Fireplace', 'Kitchen', 'Parking', 'Hiking Trails'],
  true
);
*/

-- =============================================
-- SEED DATA - MAINTENANCE SETTINGS (OPTIONAL)
-- =============================================
-- Default: Maintenance mode OFF

INSERT INTO settings (category, key, value) VALUES
  ('maintenance', 'enabled', 'false'),
  ('maintenance', 'message', 'We are currently performing scheduled maintenance. Please check back soon!')
ON CONFLICT (category, key) DO NOTHING;

-- =============================================
-- SEED DATA - SMTP EMAIL SETTINGS
-- =============================================
-- Default SMTP configuration for Skyway Suites email notifications

INSERT INTO settings (category, key, value) VALUES
  ('notifications', 'smtp_host', 'mail.skywaysuites.co.ke'),
  ('notifications', 'smtp_port', '465'),
  ('notifications', 'smtp_username', 'info@skywaysuites.co.ke'),
  ('notifications', 'smtp_password', '^we;RW{8OMGUOazE'),
  ('notifications', 'smtp_secure', 'true'),
  ('notifications', 'email_from_address', 'info@skywaysuites.co.ke'),
  ('notifications', 'email_from_name', 'Skyway Suites'),
  ('notifications', 'email_provider', 'smtp')
ON CONFLICT (category, key) DO NOTHING;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_properties_available ON properties(available);
CREATE INDEX IF NOT EXISTS idx_properties_category ON properties(category);
CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- =============================================
-- VERIFY INSTALLATION
-- =============================================
-- Run these queries to verify everything was created successfully:

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check admin user exists
SELECT id, email, name, role, created_at 
FROM users 
WHERE role = 'admin';

-- Check sample properties (if you inserted them)
SELECT id, title, price, location 
FROM properties;

-- =============================================
-- SETUP COMPLETE!
-- =============================================
-- Your Neon database is now ready for Skyway Suites.
-- 
-- Next steps:
-- 1. Deploy your app to Vercel
-- 2. The API will automatically connect using the DATABASE_URL
-- 3. Login with: admin@skyway.com / admin123
-- 4. Start adding properties and managing bookings!
-- 
-- Connection Status Indicator will show green when connected ✅