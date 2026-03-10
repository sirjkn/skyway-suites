import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './config/db.js';

// Helper to transform database row to API format
function transformBooking(row: any) {
  return {
    id: row.id,
    propertyId: row.property_id,
    customerId: row.customer_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
    guests: row.guests,
    totalPrice: parseFloat(row.total_price),
    status: row.status,
    createdAt: row.created_at
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

    // Single booking operations (when ID is provided)
    if (id && typeof id === 'string') {
      if (req.method === 'GET') {
        const result = await query('SELECT * FROM bookings WHERE id = $1', [id]);

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Booking not found' });
        }

        return res.status(200).json(transformBooking(result.rows[0]));
      }

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
        return res.status(200).json({ message: 'Booking deleted successfully' });
      }
    }

    // Collection operations (when no ID is provided)
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM bookings ORDER BY created_at DESC');
      return res.status(200).json(result.rows.map(transformBooking));
    }

    if (req.method === 'POST') {
      const { property_id, customer_id, check_in, check_out, guests, total_price } = req.body;

      const result = await query(
        'INSERT INTO bookings (property_id, customer_id, check_in, check_out, guests, total_price, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [property_id, customer_id, check_in, check_out, guests, total_price, 'pending']
      );

      return res.status(200).json(transformBooking(result.rows[0]));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Bookings API error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}