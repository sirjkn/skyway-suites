import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './config/db.js';
import { hashPassword, verifyPassword, generateToken } from './utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json'); // Explicitly set Content-Type

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action } = req.query;

    // Login endpoint
    if (action === 'login' && req.method === 'POST') {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      try {
        // Find user
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
          return res.status(401).json({ 
            error: 'Invalid credentials',
            hint: 'User not found. Make sure your database is set up correctly.'
          });
        }

        const user = result.rows[0];

        // Verify password
        const validPassword = await verifyPassword(password, user.password_hash);
        
        if (!validPassword) {
          return res.status(401).json({ 
            error: 'Invalid credentials',
            hint: 'Incorrect password'
          });
        }

        // Generate token
        const token = generateToken(user.id);

        return res.status(200).json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          token
        });
      } catch (dbError) {
        console.error('Database error during login:', dbError);
        return res.status(500).json({ 
          error: 'Database connection failed',
          hint: 'Please check your DATABASE_URL environment variable in Vercel',
          details: process.env.NODE_ENV === 'development' ? String(dbError) : undefined
        });
      }
    }

    // Signup endpoint
    if (action === 'signup' && req.method === 'POST') {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
      }

      try {
        // Check if user exists
        const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (existingUser.rows.length > 0) {
          return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Insert user
        const result = await query(
          'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
          [email, hashedPassword, name, 'customer']
        );

        const user = result.rows[0];
        const token = generateToken(user.id);

        return res.status(200).json({ user, token });
      } catch (dbError) {
        console.error('Database error during signup:', dbError);
        return res.status(500).json({ 
          error: 'Database connection failed',
          hint: 'Please check your DATABASE_URL environment variable in Vercel',
          details: process.env.NODE_ENV === 'development' ? String(dbError) : undefined
        });
      }
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
}