import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './config/db.js';
import { hashPassword, verifyPassword, generateToken } from './utils/auth.js';

// Helper to transform database row to API format for properties
function transformProperty(row: any) {
  return {
    id: String(row.id), // Convert to string for consistency with frontend
    title: row.title,
    description: row.description,
    price: parseFloat(row.price),
    location: row.location,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    guests: row.guests,
    category: row.category,
    image: row.image,
    photos: row.photos || [],
    amenities: row.amenities || [],
    available: row.available,
    averageRating: row.average_rating ? parseFloat(row.average_rating) : 0,
    reviewCount: row.review_count || 0,
    icalUrl: row.ical_export_url,
    airbnbCalendarUrl: row.airbnb_import_url,
    calendarSyncEnabled: row.calendar_sync_enabled,
    lastCalendarSync: row.last_calendar_sync,
    createdAt: row.created_at
  };
}

// Helper to transform database row to API format for bookings
function transformBooking(row: any) {
  return {
    id: String(row.id),
    propertyId: String(row.property_id),
    customerId: String(row.customer_id),
    checkIn: row.check_in,
    checkOut: row.check_out,
    guests: row.guests,
    totalPrice: parseFloat(row.total_price),
    amountPaid: row.amount_paid ? parseFloat(row.amount_paid) : 0,
    status: row.status,
    createdAt: row.created_at
  };
}

// Helper to transform database row to API format for payments
function transformPayment(row: any) {
  return {
    id: String(row.id),
    bookingId: String(row.booking_id),
    customerId: String(row.customer_id),
    amount: parseFloat(row.amount),
    status: row.status,
    paymentMethod: row.payment_method,
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
      try {
        // Actually test the database connection
        const result = await query('SELECT NOW() as current_time');
        const dbTime = result.rows[0]?.current_time;
        
        return res.status(200).json({ 
          status: 'ok', 
          database: 'connected',
          message: 'Skyway Suites API is running',
          timestamp: new Date().toISOString(),
          dbTimestamp: dbTime
        });
      } catch (dbError) {
        console.error('❌ Database health check failed:', dbError);
        return res.status(503).json({ 
          status: 'error',
          database: 'disconnected', 
          message: 'Database connection failed',
          error: dbError instanceof Error ? dbError.message : String(dbError),
          timestamp: new Date().toISOString() 
        });
      }
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
      // Item operations
      if (id && typeof id === 'string') {
        if (req.method === 'GET') {
          // GET single property by ID
          try {
            console.log('🔍 GET /api/properties - Fetching property with ID:', id);
            
            // Validate UUID format (basic check)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(id)) {
              console.error('❌ Invalid UUID format:', id);
              return res.status(400).json({ error: 'Invalid property ID format' });
            }
            
            const result = await query('SELECT * FROM properties WHERE id = $1', [id]);
            console.log('📊 Query result:', { rowCount: result.rows.length });
            
            if (result.rows.length === 0) {
              console.log('❌ Property not found for ID:', id);
              return res.status(404).json({ error: 'Property not found' });
            }
            
            const property = transformProperty(result.rows[0]);
            console.log('✅ Property found:', property.title);
            return res.status(200).json(property);
          } catch (error) {
            console.error('❌ Error fetching property:', error);
            return res.status(500).json({ 
              error: 'Failed to fetch property',
              details: error instanceof Error ? error.message : String(error)
            });
          }
        }
        
        if (req.method === 'PUT') {
          // Support partial updates - only update fields that are provided
          const updates: string[] = [];
          const values: any[] = [];
          let paramIndex = 1;
          
          const fields = req.body;
          
          // Build dynamic UPDATE query based on provided fields
          if (fields.title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            values.push(fields.title);
          }
          if (fields.description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            values.push(fields.description);
          }
          if (fields.price !== undefined) {
            updates.push(`price = $${paramIndex++}`);
            values.push(fields.price);
          }
          if (fields.location !== undefined) {
            updates.push(`location = $${paramIndex++}`);
            values.push(fields.location);
          }
          if (fields.bedrooms !== undefined) {
            updates.push(`bedrooms = $${paramIndex++}`);
            values.push(fields.bedrooms);
          }
          if (fields.bathrooms !== undefined) {
            updates.push(`bathrooms = $${paramIndex++}`);
            values.push(fields.bathrooms);
          }
          if (fields.guests !== undefined) {
            updates.push(`guests = $${paramIndex++}`);
            values.push(fields.guests);
          }
          if (fields.category !== undefined) {
            updates.push(`category = $${paramIndex++}`);
            values.push(fields.category);
          }
          if (fields.image !== undefined) {
            updates.push(`image = $${paramIndex++}`);
            values.push(fields.image);
          }
          if (fields.photos !== undefined) {
            updates.push(`photos = $${paramIndex++}`);
            values.push(fields.photos);
          }
          if (fields.amenities !== undefined) {
            updates.push(`amenities = $${paramIndex++}`);
            values.push(fields.amenities);
          }
          if (fields.available !== undefined) {
            updates.push(`available = $${paramIndex++}`);
            values.push(fields.available);
          }
          if (fields.ical_export_url !== undefined) {
            updates.push(`ical_export_url = $${paramIndex++}`);
            values.push(fields.ical_export_url);
          }
          if (fields.airbnb_import_url !== undefined) {
            updates.push(`airbnb_import_url = $${paramIndex++}`);
            values.push(fields.airbnb_import_url);
          }
          if (fields.calendar_sync_enabled !== undefined) {
            updates.push(`calendar_sync_enabled = $${paramIndex++}`);
            values.push(fields.calendar_sync_enabled);
          }
          
          if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
          }
          
          // Add id as the last parameter
          values.push(id);
          
          const result = await query(
            `UPDATE properties SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
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
        const { title, description, price, location, bedrooms, bathrooms, guests, category, image, photos, amenities,
          ical_export_url, airbnb_import_url, calendar_sync_enabled } = req.body;
        const result = await query(
          `INSERT INTO properties 
           (title, description, price, location, bedrooms, bathrooms, guests, category, image, photos, amenities,
            ical_export_url, airbnb_import_url, calendar_sync_enabled) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
          [title, description, price, location, bedrooms, bathrooms, guests, category, image, photos, amenities,
           ical_export_url, airbnb_import_url, calendar_sync_enabled]
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
          return res.status(200).json(transformBooking(result.rows[0]));
        }
        if (req.method === 'DELETE') {
          await query('DELETE FROM bookings WHERE id = $1', [id]);
          return res.status(200).json({ message: 'Booking deleted' });
        }
      }

      if (req.method === 'GET') {
        const result = await query('SELECT * FROM bookings ORDER BY created_at DESC');
        return res.status(200).json(result.rows.map(transformBooking));
      }

      if (req.method === 'POST') {
        const { propertyId, customerId, checkIn, checkOut, guests, totalPrice } = req.body;
        const result = await query(
          'INSERT INTO bookings (property_id, customer_id, check_in, check_out, guests, total_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [propertyId, customerId, checkIn, checkOut, guests, totalPrice]
        );
        return res.status(200).json(transformBooking(result.rows[0]));
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
          return res.status(200).json(transformPayment(result.rows[0]));
        }
        if (req.method === 'DELETE') {
          await query('DELETE FROM payments WHERE id = $1', [id]);
          return res.status(200).json({ message: 'Payment deleted' });
        }
      }

      if (req.method === 'GET') {
        const result = await query('SELECT * FROM payments ORDER BY created_at DESC');
        return res.status(200).json(result.rows.map(transformPayment));
      }

      if (req.method === 'POST') {
        const { bookingId, customerId, amount, paymentMethod, status } = req.body;
        const paymentStatus = status || 'pending'; // Use provided status or default to 'pending'
        const result = await query(
          'INSERT INTO payments (booking_id, customer_id, amount, payment_method, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [bookingId, customerId, amount, paymentMethod, paymentStatus]
        );
        
        console.log('✅ Payment created:', result.rows[0]);
        const transformedPayment = transformPayment(result.rows[0]);
        console.log('✅ Transformed payment:', transformedPayment);
        
        return res.status(200).json(transformedPayment);
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

      // Handle fetching settings by category
      if (action === 'category' && req.method === 'GET') {
        const { category } = req.query;
        if (!category || typeof category !== 'string') {
          return res.status(400).json({ error: 'Category is required' });
        }
        
        const result = await query(
          'SELECT * FROM settings WHERE category = $1',
          [category]
        );
        
        const settings: any = {};
        result.rows.forEach(row => {
          // Convert snake_case to camelCase for the frontend
          const camelKey = row.key.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase());
          settings[camelKey] = row.value;
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

    // ============================================
    // REVIEWS ENDPOINTS
    // ============================================
    if (endpoint === 'reviews') {
      const { propertyId, bookingId } = req.query;

      // Get review by booking ID
      if (bookingId && typeof bookingId === 'string' && req.method === 'GET') {
        const result = await query(
          `SELECT r.*, c.name as customer_name 
           FROM reviews r 
           JOIN customers c ON r.customer_id = c.id 
           WHERE r.booking_id = $1`,
          [bookingId]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Review not found' });
        }
        return res.status(200).json(result.rows[0]);
      }

      // Single review operations
      if (id && typeof id === 'string') {
        if (req.method === 'GET') {
          const result = await query(
            `SELECT r.*, c.name as customer_name 
             FROM reviews r 
             JOIN customers c ON r.customer_id = c.id 
             WHERE r.id = $1`,
            [id]
          );
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
          }
          return res.status(200).json(result.rows[0]);
        }

        if (req.method === 'PUT') {
          const { rating, comment } = req.body;
          const result = await query(
            'UPDATE reviews SET rating = $1, comment = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [rating, comment, id]
          );
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
          }
          return res.status(200).json(result.rows[0]);
        }

        if (req.method === 'DELETE') {
          await query('DELETE FROM reviews WHERE id = $1', [id]);
          return res.status(200).json({ message: 'Review deleted' });
        }
      }

      // Collection operations
      if (req.method === 'GET') {
        let queryStr = `SELECT r.*, c.name as customer_name 
                        FROM reviews r 
                        JOIN customers c ON r.customer_id = c.id`;
        const params: any[] = [];
        
        if (propertyId && typeof propertyId === 'string') {
          queryStr += ' WHERE r.property_id = $1';
          params.push(propertyId);
        }
        
        queryStr += ' ORDER BY r.created_at DESC';
        
        const result = await query(queryStr, params);
        return res.status(200).json(result.rows);
      }

      if (req.method === 'POST') {
        const { bookingId, customerId, propertyId, rating, comment } = req.body;
        
        // Validate required fields
        if (!bookingId || !customerId || !propertyId || !rating) {
          return res.status(400).json({ error: 'Booking ID, customer ID, property ID, and rating are required' });
        }

        // Check if review already exists for this booking
        const existing = await query('SELECT id FROM reviews WHERE booking_id = $1', [bookingId]);
        if (existing.rows.length > 0) {
          return res.status(400).json({ error: 'Review already exists for this booking' });
        }

        // Verify booking belongs to customer and is completed
        const booking = await query(
          'SELECT * FROM bookings WHERE id = $1 AND customer_id = $2',
          [bookingId, customerId]
        );
        if (booking.rows.length === 0) {
          return res.status(404).json({ error: 'Booking not found or does not belong to this customer' });
        }

        // Check if booking checkout date has passed
        const checkoutDate = new Date(booking.rows[0].check_out);
        const now = new Date();
        if (checkoutDate > now) {
          return res.status(400).json({ error: 'Cannot review a property before checkout date' });
        }

        const result = await query(
          'INSERT INTO reviews (booking_id, customer_id, property_id, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [bookingId, customerId, propertyId, rating, comment || '']
        );
        return res.status(200).json(result.rows[0]);
      }
    }

    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    console.error('❌ API ERROR - FULL DETAILS:', error);
    console.error('❌ ERROR MESSAGE:', error instanceof Error ? error.message : String(error));
    console.error('❌ ERROR STACK:', error instanceof Error ? error.stack : 'No stack');
    
    // Return detailed error message for debugging
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
      // Always return details for debugging (remove in production if needed)
      fullError: String(error)
    });
  }
}