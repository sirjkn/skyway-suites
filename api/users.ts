import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './config/db.js';
import { hashPassword } from './utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Fetch all users
    if (req.method === 'GET') {
      const result = await query(
        'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
      );

      const users = result.rows.map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
        status: 'active', // You can add a status column to the database later if needed
      }));

      return res.status(200).json(users);
    }

    // POST - Create new user
    if (req.method === 'POST') {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name || !role) {
        return res.status(400).json({ error: 'Email, password, name, and role are required' });
      }

      // Check if user exists
      const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Insert user
      const result = await query(
        'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
        [email, hashedPassword, name, role]
      );

      const user = result.rows[0];

      return res.status(201).json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
        status: 'active',
      });
    }

    // PUT - Update user
    if (req.method === 'PUT') {
      const { id } = req.query;
      const { email, name, role, password } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (email) {
        updates.push(`email = $${paramCount++}`);
        values.push(email);
      }
      if (name) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (role) {
        updates.push(`role = $${paramCount++}`);
        values.push(role);
      }
      if (password) {
        const hashedPassword = await hashPassword(password);
        updates.push(`password_hash = $${paramCount++}`);
        values.push(hashedPassword);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id);
      const result = await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, name, role, created_at`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];

      return res.status(200).json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
        status: 'active',
      });
    }

    // DELETE - Delete user
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({ message: 'User deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
