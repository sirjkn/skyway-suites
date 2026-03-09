import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './config/db';
import { hashPassword } from './utils/auth';

// Helper to transform database row to API format
function transformCustomer(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at,
    totalBookings: row.total_bookings || 0
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { id } = req.query;

    // Single customer operations
    if (id && typeof id === 'string') {
      if (req.method === 'GET') {
        const result = await query('SELECT * FROM customers WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Customer not found' });
        }
        
        return res.status(200).json(result.rows[0]);
      }

      if (req.method === 'PUT') {
        const { name, email, phone, password } = req.body;
        
        let updateQuery = 'UPDATE customers SET name = $1, email = $2, phone = $3';
        let params = [name, email, phone];
        
        // If password is provided, hash it and include in update
        if (password) {
          const hashedPassword = await hashPassword(password);
          updateQuery += ', password_hash = $4 WHERE id = $5 RETURNING *';
          params.push(hashedPassword, id);
        } else {
          updateQuery += ' WHERE id = $4 RETURNING *';
          params.push(id);
        }
        
        const result = await query(updateQuery, params);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Customer not found' });
        }
        
        return res.status(200).json(result.rows[0]);
      }

      if (req.method === 'DELETE') {
        await query('DELETE FROM customers WHERE id = $1', [id]);
        return res.status(200).json({ message: 'Customer deleted successfully' });
      }
    }

    // Collection operations
    if (req.method === 'GET') {
      const result = await query(`
        SELECT c.*, COUNT(b.id)::int as total_bookings 
        FROM customers c 
        LEFT JOIN bookings b ON c.id = b.customer_id 
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `);
      return res.status(200).json(result.rows.map(transformCustomer));
    }

    if (req.method === 'POST') {
      const { name, email, phone, password } = req.body;
      
      if (password) {
        const hashedPassword = await hashPassword(password);
        const result = await query(
          'INSERT INTO customers (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING *',
          [name, email, phone, hashedPassword]
        );
        return res.status(200).json(result.rows[0]);
      } else {
        const result = await query(
          'INSERT INTO customers (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
          [name, email, phone]
        );
        return res.status(200).json(result.rows[0]);
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Customers API error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}