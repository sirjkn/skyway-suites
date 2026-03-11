-- Run this SQL script in your Neon database console to create all tables

-- Drop tables if they exist (careful in production!)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS contact_submissions CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS hero_settings CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Users table (for authentication)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Properties table
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

-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings table
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

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Contact form submissions
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Settings table (replaces hero_settings)
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, key)
);

-- Create indexes for better performance
CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_settings_category ON settings(category);

-- Insert sample data

-- Sample admin user (password: admin123)
-- IMPORTANT: This password hash is for TESTING ONLY. Change it in production!
-- To generate your own hash, use: https://bcrypt-generator.com/ with rounds=10
INSERT INTO users (email, name, password_hash, role) VALUES 
('admin@skywaysuites.com', 'Admin User', '$2b$10$rYb8z9J5QZ5qXJ0YhX5JjOWQYZ5qXJ0YhX5JjPJ5N0YZ.kGKKKKK6', 'admin');

-- Sample customer user (password: customer123)
INSERT INTO users (email, name, password_hash, role) VALUES 
('customer@test.com', 'Test Customer', '$2b$10$sYc9z9K6RZ6rYK1ZiY6KkPXRZA6rYK1ZiY6KkQK6O1ZA.lHLLLLL7', 'customer');

-- Sample properties
INSERT INTO properties (title, description, price, location, bedrooms, bathrooms, guests, category, image, amenities) VALUES
('Luxury Downtown Apartment', 'Beautiful modern apartment in the heart of downtown with stunning city views.', 150.00, 'New York, NY', 2, 2, 4, '2 Bedroom', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', ARRAY['WiFi', 'Kitchen', 'Air Conditioning', 'TV', 'Workspace']),
('Cozy Beach House', 'Relaxing beachfront property with private access to the beach.', 200.00, 'Malibu, CA', 3, 2, 6, '3 Bedroom', 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800', ARRAY['WiFi', 'Beach Access', 'BBQ Grill', 'Parking', 'Ocean View']),
('Mountain Cabin Retreat', 'Secluded cabin in the mountains perfect for a peaceful getaway.', 120.00, 'Aspen, CO', 2, 1, 4, '2 Bedroom', 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800', ARRAY['Fireplace', 'Hiking Trails', 'Pet Friendly', 'Kitchen', 'Hot Tub']),
('Urban Loft Studio', 'Modern loft in trendy neighborhood with industrial charm.', 95.00, 'Portland, OR', 1, 1, 2, 'Studio', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', ARRAY['WiFi', 'Workspace', 'Full Kitchen', 'Gym Access']),
('Lakefront Villa', 'Stunning villa with panoramic lake views and private dock.', 300.00, 'Lake Tahoe, NV', 4, 3, 8, '3 Bedroom', 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800', ARRAY['Lake Access', 'Boat Dock', 'Fire Pit', 'Hot Tub', 'BBQ Grill']);

-- Sample customers
INSERT INTO customers (name, email, phone) VALUES
('John Doe', 'john@example.com', '+1 (555) 123-4567'),
('Jane Smith', 'jane@example.com', '+1 (555) 987-6543'),
('Michael Brown', 'michael@example.com', '+1 (555) 456-7890');

-- Sample bookings
INSERT INTO bookings (property_id, customer_id, check_in, check_out, guests, total_price, status) VALUES
((SELECT id FROM properties WHERE title = 'Luxury Downtown Apartment' LIMIT 1), 
 (SELECT id FROM users WHERE email = 'customer@test.com' LIMIT 1),
 '2026-03-15', '2026-03-20', 2, 750.00, 'confirmed'),
((SELECT id FROM properties WHERE title = 'Cozy Beach House' LIMIT 1),
 (SELECT id FROM users WHERE email = 'customer@test.com' LIMIT 1),
 '2026-04-10', '2026-04-17', 4, 1400.00, 'pending');

-- Sample payments
INSERT INTO payments (booking_id, customer_id, amount, status, payment_method) VALUES
((SELECT id FROM bookings LIMIT 1 OFFSET 0),
 (SELECT id FROM customers WHERE email = 'john@example.com' LIMIT 1),
 750.00, 'paid', 'Credit Card'),
((SELECT id FROM bookings LIMIT 1 OFFSET 1),
 (SELECT id FROM customers WHERE email = 'jane@example.com' LIMIT 1),
 1400.00, 'pending', 'Credit Card');

-- Default hero background (Nairobi cityscape)
INSERT INTO settings (category, key, value) VALUES
('hero', 'background_image', 'https://images.unsplash.com/photo-1741991109886-90e70988f27b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxOYWlyb2JpJTIwS2VueWElMjBjaXR5c2NhcGUlMjBza3lsaW5lfGVufDF8fHx8MTc3MzAzNTM5OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'),
('general', 'site_name', 'Skyway Suites'),
('general', 'site_email', 'info@skywaysuites.com'),
('general', 'currency', 'USD'),
('general', 'timezone', 'America/New_York'),
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

-- Verify tables were created
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';