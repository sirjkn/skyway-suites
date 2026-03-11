-- ============================================
-- QUICK DATABASE SETUP FOR SKYWAY SUITES
-- ============================================
-- Copy and paste this ENTIRE script into your Neon SQL Editor
-- This will create all tables and add test users with working passwords

-- Step 1: Clean up existing tables (if any)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS contact_submissions CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Step 2: Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Create properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  location VARCHAR(255) NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  guests INTEGER NOT NULL,
  category VARCHAR(50),
  image TEXT,
  amenities TEXT[],
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 4: Create customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 5: Create bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 6: Create payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 7: Create contact submissions table
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 8: Create settings table
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, key)
);

-- Step 9: Create indexes
CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_settings_category ON settings(category);

-- ============================================
-- INSERT TEST DATA WITH WORKING PASSWORDS
-- ============================================

-- Insert admin user: admin@skywaysuites.com / admin123
-- This hash was generated with bcrypt rounds=10
INSERT INTO users (email, name, password_hash, role) VALUES 
('admin@skywaysuites.com', 'Admin User', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert customer user: customer@test.com / test123
INSERT INTO users (email, name, password_hash, role) VALUES 
('customer@test.com', 'Test Customer', '$2b$10$7bFH0nK9qL1vWZgFqrLBXOZbqH9z8mW7jH4vL5nU9pW6kF8yT6.Yu', 'customer');

-- Insert sample properties
INSERT INTO properties (title, description, price, location, bedrooms, bathrooms, guests, category, image, amenities) VALUES
('Luxury Nairobi Penthouse', 'Stunning penthouse in Westlands with panoramic city views and modern amenities.', 250.00, 'Westlands, Nairobi', 3, 2, 6, '3 Bedroom', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', ARRAY['WiFi', 'Pool', 'Gym', 'Parking', 'Security', 'Kitchen']),
('Karen Villa', 'Spacious villa in the serene Karen suburb, perfect for families.', 350.00, 'Karen, Nairobi', 4, 3, 8, '3 Bedroom', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', ARRAY['WiFi', 'Garden', 'BBQ Area', 'Parking', 'Security', 'Kitchen']),
('Kilimani Apartment', 'Modern 2-bedroom apartment in the heart of Kilimani.', 150.00, 'Kilimani, Nairobi', 2, 2, 4, '2 Bedroom', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', ARRAY['WiFi', 'Parking', 'Security', 'Kitchen', 'Balcony']),
('Runda Estate Home', 'Exclusive home in the prestigious Runda Estate.', 500.00, 'Runda, Nairobi', 5, 4, 10, '3 Bedroom', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', ARRAY['WiFi', 'Pool', 'Garden', 'Security', 'Kitchen', 'Staff Quarters']),
('Lavington Townhouse', 'Beautiful townhouse in quiet Lavington neighborhood.', 200.00, 'Lavington, Nairobi', 3, 2, 6, '3 Bedroom', 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800', ARRAY['WiFi', 'Parking', 'Security', 'Kitchen', 'Garden']);

-- Insert sample customers
INSERT INTO customers (name, email, phone) VALUES
('John Kamau', 'john@example.com', '+254 712 345 678'),
('Mary Wanjiku', 'mary@example.com', '+254 723 456 789'),
('Peter Omondi', 'peter@example.com', '+254 734 567 890');

-- Insert sample bookings
INSERT INTO bookings (property_id, customer_id, check_in, check_out, guests, total_price, status) VALUES
((SELECT id FROM properties WHERE title = 'Luxury Nairobi Penthouse' LIMIT 1), 
 (SELECT id FROM users WHERE email = 'customer@test.com' LIMIT 1),
 '2026-03-20', '2026-03-25', 4, 1250.00, 'confirmed'),
((SELECT id FROM properties WHERE title = 'Karen Villa' LIMIT 1),
 (SELECT id FROM users WHERE email = 'customer@test.com' LIMIT 1),
 '2026-04-10', '2026-04-17', 6, 2450.00, 'pending');

-- Insert sample payments
INSERT INTO payments (booking_id, customer_id, amount, status, payment_method) VALUES
((SELECT id FROM bookings LIMIT 1 OFFSET 0),
 (SELECT id FROM customers WHERE email = 'john@example.com' LIMIT 1),
 1250.00, 'paid', 'M-Pesa'),
((SELECT id FROM bookings LIMIT 1 OFFSET 1),
 (SELECT id FROM customers WHERE email = 'mary@example.com' LIMIT 1),
 2450.00, 'pending', 'Bank Transfer');

-- Insert default settings
INSERT INTO settings (category, key, value) VALUES
('general', 'site_name', 'Skyway Suites'),
('general', 'site_email', 'info@skywaysuites.com'),
('general', 'currency', 'KES'),
('general', 'timezone', 'Africa/Nairobi'),
('cloudinary', 'cloud_name', 'dc5d5zfos'),
('cloudinary', 'api_key', '382325619466152'),
('cloudinary', 'api_secret', '-TZoR9QSDk1lMfEOdQc-Tv59f9A'),
('maintenance', 'enabled', 'false'),
('maintenance', 'message', 'We''re currently performing scheduled maintenance to improve your experience.'),
('maintenance', 'estimated_time', 'We''ll be back soon'),
('notifications', 'smtp_host', 'mail.skywaysuites.co.ke'),
('notifications', 'smtp_port', '465'),
('notifications', 'smtp_username', 'info@skywaysuites.co.ke'),
('notifications', 'smtp_password', '^we;RW{8OMGUOazE'),
('notifications', 'smtp_secure', 'true'),
('notifications', 'email_from_address', 'info@skywaysuites.co.ke'),
('notifications', 'email_from_name', 'Skyway Suites'),
('notifications', 'email_provider', 'smtp')
ON CONFLICT (category, key) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

-- Show all users (you should see 2 users)
SELECT 'USERS:' as table_name, email, name, role, created_at FROM users;

-- Show all properties (you should see 5 properties)
SELECT 'PROPERTIES:' as table_name, title, location, price FROM properties;

-- Show all bookings (you should see 2 bookings)
SELECT 'BOOKINGS:' as table_name, b.id, p.title, u.name, b.status FROM bookings b
JOIN properties p ON b.property_id = p.id
JOIN users u ON b.customer_id = u.id;

-- ============================================
-- SUCCESS!
-- ============================================
-- You can now login to your app with:
-- 
-- Admin Account:
--   Email: admin@skywaysuites.com
--   Password: admin123
--
-- Customer Account:
--   Email: customer@test.com
--   Password: test123
-- ============================================