import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './config/db.js';
import { hashPassword, verifyPassword, generateToken } from './utils/auth.js';

// Helper to transform database row to API format for properties
function transformProperty(row: any) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: parseFloat(row.price),
    location: row.location,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    guests: row.guests,
    category: row.category,
    image: row.image,
    amenities: row.amenities || [],
    available: row.available,
    icalUrl: row.ical_export_url,
    airbnbCalendarUrl: row.airbnb_import_url,
    bookingCalendarUrl: row.booking_import_url,
    vrboCalendarUrl: row.vrbo_import_url,
    calendarSyncEnabled: row.calendar_sync_enabled,
    lastCalendarSync: row.last_calendar_sync,
    createdAt: row.created_at
  };
}

// Unified API handler - routes all requests
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { endpoint, action, id } = req.query;

    // ============================================
    // HEALTH CHECK ENDPOINTS
    // ============================================
    if (endpoint === 'health' || !endpoint) {
      return res.status(200).json({ 
        status: 'ok', 
        message: 'Skyway Suites API is running',
        timestamp: new Date().toISOString() 
      });
    }

    // ============================================
    // AUTHENTICATION ENDPOINTS
    // ============================================
    if (endpoint === 'auth') {
      if (action === 'login' && req.method === 'POST') {
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];
        const validPassword = await verifyPassword(password, user.password_hash);
        if (!validPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = generateToken(user.id);
        return res.status(200).json({
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          token
        });
      }

      if (action === 'signup' && req.method === 'POST') {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
          return res.status(400).json({ error: 'Email, password, and name are required' });
        }
        const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
          return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await hashPassword(password);
        const result = await query(
          'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
          [email, hashedPassword, name, 'customer']
        );
        const user = result.rows[0];
        const token = generateToken(user.id);
        return res.status(200).json({ user, token });
      }
    }

    // ============================================
    // PROPERTIES ENDPOINTS
    // ============================================
    if (endpoint === 'properties') {
      // Single property operations
      if (id && typeof id === 'string') {
        if (req.method === 'GET') {
          const result = await query('SELECT * FROM properties WHERE id = $1', [id]);
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
          }
          return res.status(200).json(transformProperty(result.rows[0]));
        }

        if (req.method === 'PUT') {
          const { title, description, price, location, bedrooms, bathrooms, guests, category, image, amenities, available,
            ical_export_url, airbnb_import_url, booking_import_url, vrbo_import_url, calendar_sync_enabled } = req.body;
          const result = await query(
            `UPDATE properties 
             SET title = $1, description = $2, price = $3, location = $4, bedrooms = $5, 
                 bathrooms = $6, guests = $7, category = $8, image = $9, amenities = $10, available = $11,
                 ical_export_url = $12, airbnb_import_url = $13, booking_import_url = $14,
                 vrbo_import_url = $15, calendar_sync_enabled = $16
             WHERE id = $17 RETURNING *`,
            [title, description, price, location, bedrooms, bathrooms, guests, category, image, amenities, available,
             ical_export_url, airbnb_import_url, booking_import_url, vrbo_import_url, calendar_sync_enabled, id]
          );
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
          }
          return res.status(200).json(transformProperty(result.rows[0]));
        }

        if (req.method === 'DELETE') {
          await query('DELETE FROM properties WHERE id = $1', [id]);
          return res.status(200).json({ message: 'Property deleted successfully' });
        }
      }

      // Collection operations
      if (req.method === 'GET') {
        const result = await query('SELECT * FROM properties WHERE available = true ORDER BY created_at DESC');
        return res.status(200).json(result.rows.map(transformProperty));
      }

      if (req.method === 'POST') {
        const { title, description, price, location, bedrooms, bathrooms, guests, category, image, amenities,
          ical_export_url, airbnb_import_url, booking_import_url, vrbo_import_url, calendar_sync_enabled } = req.body;
        const result = await query(
          `INSERT INTO properties 
           (title, description, price, location, bedrooms, bathrooms, guests, category, image, amenities,
            ical_export_url, airbnb_import_url, booking_import_url, vrbo_import_url, calendar_sync_enabled) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
          [title, description, price, location, bedrooms, bathrooms, guests, category, image, amenities,
           ical_export_url, airbnb_import_url, booking_import_url, vrbo_import_url, calendar_sync_enabled]
        );
        return res.status(200).json(transformProperty(result.rows[0]));
      }
    }

    // ============================================
    // BOOKINGS ENDPOINTS
    // ============================================
    if (endpoint === 'bookings') {
      if (id && typeof id === 'string') {
        if (req.method === 'PUT') {
          const { status } = req.body;
          const result = await query(
            'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
          );
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
          }
          return res.status(200).json(result.rows[0]);
        }
        if (req.method === 'DELETE') {
          await query('DELETE FROM bookings WHERE id = $1', [id]);
          return res.status(200).json({ message: 'Booking deleted' });
        }
      }

      if (req.method === 'GET') {
        const result = await query('SELECT * FROM bookings ORDER BY created_at DESC');
        return res.status(200).json(result.rows);
      }

      if (req.method === 'POST') {
        const { propertyId, customerId, checkIn, checkOut, guests, totalPrice } = req.body;
        const result = await query(
          'INSERT INTO bookings (property_id, customer_id, check_in, check_out, guests, total_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [propertyId, customerId, checkIn, checkOut, guests, totalPrice]
        );
        return res.status(200).json(result.rows[0]);
      }
    }

    // ============================================
    // CUSTOMERS ENDPOINTS
    // ============================================
    if (endpoint === 'customers') {
      if (id && typeof id === 'string') {
        if (req.method === 'PUT') {
          const { name, email, phone } = req.body;
          const result = await query(
            'UPDATE customers SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING *',
            [name, email, phone, id]
          );
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
          }
          return res.status(200).json(result.rows[0]);
        }
        if (req.method === 'DELETE') {
          await query('DELETE FROM customers WHERE id = $1', [id]);
          return res.status(200).json({ message: 'Customer deleted' });
        }
      }

      if (req.method === 'GET') {
        const result = await query('SELECT * FROM customers ORDER BY created_at DESC');
        return res.status(200).json(result.rows);
      }

      if (req.method === 'POST') {
        const { name, email, phone } = req.body;
        const result = await query(
          'INSERT INTO customers (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
          [name, email, phone]
        );
        return res.status(200).json(result.rows[0]);
      }
    }

    // ============================================
    // PAYMENTS ENDPOINTS
    // ============================================
    if (endpoint === 'payments') {
      if (id && typeof id === 'string') {
        if (req.method === 'PUT') {
          const { status } = req.body;
          const result = await query(
            'UPDATE payments SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
          );
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
          }
          return res.status(200).json(result.rows[0]);
        }
        if (req.method === 'DELETE') {
          await query('DELETE FROM payments WHERE id = $1', [id]);
          return res.status(200).json({ message: 'Payment deleted' });
        }
      }

      if (req.method === 'GET') {
        const result = await query('SELECT * FROM payments ORDER BY created_at DESC');
        return res.status(200).json(result.rows);
      }

      if (req.method === 'POST') {
        const { bookingId, customerId, amount, paymentMethod } = req.body;
        const result = await query(
          'INSERT INTO payments (booking_id, customer_id, amount, payment_method, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [bookingId, customerId, amount, paymentMethod, 'pending']
        );
        return res.status(200).json(result.rows[0]);
      }
    }

    // ============================================
    // CONTACT ENDPOINTS
    // ============================================
    if (endpoint === 'contact' && req.method === 'POST') {
      const { name, email, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
      }
      await query(
        'INSERT INTO contact_submissions (name, email, message) VALUES ($1, $2, $3)',
        [name, email, message]
      );
      return res.status(200).json({ message: 'Message sent successfully' });
    }

    // ============================================
    // USERS ENDPOINTS (Admin Management)
    // ============================================
    if (endpoint === 'users') {
      if (id && typeof id === 'string') {
        if (req.method === 'PUT') {
          const { name, email, role, password } = req.body;
          if (password) {
            const hashedPassword = await hashPassword(password);
            const result = await query(
              'UPDATE users SET name = $1, email = $2, role = $3, password_hash = $4 WHERE id = $5 RETURNING id, name, email, role, created_at',
              [name, email, role, hashedPassword, id]
            );
            if (result.rows.length === 0) {
              return res.status(404).json({ error: 'User not found' });
            }
            return res.status(200).json(result.rows[0]);
          } else {
            const result = await query(
              'UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4 RETURNING id, name, email, role, created_at',
              [name, email, role, id]
            );
            if (result.rows.length === 0) {
              return res.status(404).json({ error: 'User not found' });
            }
            return res.status(200).json(result.rows[0]);
          }
        }
        if (req.method === 'DELETE') {
          await query('DELETE FROM users WHERE id = $1', [id]);
          return res.status(200).json({ message: 'User deleted' });
        }
      }

      if (req.method === 'GET') {
        const result = await query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
        return res.status(200).json(result.rows);
      }

      if (req.method === 'POST') {
        const { name, email, role, password } = req.body;
        if (!password) {
          return res.status(400).json({ error: 'Password is required for new users' });
        }
        const hashedPassword = await hashPassword(password);
        const result = await query(
          'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
          [name, email, role, hashedPassword]
        );
        return res.status(200).json(result.rows[0]);
      }
    }

    // ============================================
    // SETTINGS ENDPOINTS
    // ============================================
    if (endpoint === 'settings') {
      if (action === 'maintenance' && req.method === 'GET') {
        const result = await query(
          "SELECT * FROM settings WHERE category = 'maintenance'"
        );
        const settings: any = {};
        result.rows.forEach(row => {
          settings[row.key] = row.value;
        });
        return res.status(200).json(settings);
      }

      if (req.method === 'GET') {
        const result = await query('SELECT * FROM settings ORDER BY category, key');
        return res.status(200).json(result.rows);
      }

      if (req.method === 'POST' || req.method === 'PUT') {
        const updates = req.body;
        if (!Array.isArray(updates)) {
          return res.status(400).json({ error: 'Settings must be an array' });
        }

        for (const setting of updates) {
          const { category, key, value } = setting;
          await query(
            `INSERT INTO settings (category, key, value) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (category, key) 
             DO UPDATE SET value = $3, updated_at = CURRENT_TIMESTAMP`,
            [category, key, value]
          );
        }
        return res.status(200).json({ message: 'Settings updated successfully' });
      }
    }

    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
}
