import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './config/db';

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

    // Single payment operations
    if (id && typeof id === 'string') {
      if (req.method === 'GET') {
        const result = await query('SELECT * FROM payments WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Payment not found' });
        }
        
        return res.status(200).json(result.rows[0]);
      }

      if (req.method === 'DELETE') {
        await query('DELETE FROM payments WHERE id = $1', [id]);
        return res.status(200).json({ message: 'Payment deleted successfully' });
      }
    }

    // Collection operations
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM payments ORDER BY created_at DESC');
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { booking_id, customer_id, amount, payment_method } = req.body;

      if (!booking_id || !customer_id || !amount || !payment_method) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await query(
        'INSERT INTO payments (booking_id, customer_id, amount, payment_method, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [booking_id, customer_id, amount, payment_method, 'paid']
      );

      return res.status(200).json(result.rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Payments API error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}