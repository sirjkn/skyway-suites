import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './config/db';

// Helper to transform database row to API format
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

    // Single property operations (when ID is provided)
    if (id && typeof id === 'string') {
      if (req.method === 'GET') {
        const result = await query('SELECT * FROM properties WHERE id = $1', [id]);

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Property not found' });
        }

        return res.status(200).json(transformProperty(result.rows[0]));
      }

      if (req.method === 'PUT') {
        const { 
          title, 
          description, 
          price, 
          location, 
          bedrooms, 
          bathrooms, 
          guests, 
          image, 
          amenities, 
          available,
          ical_export_url,
          airbnb_import_url,
          booking_import_url,
          vrbo_import_url,
          calendar_sync_enabled
        } = req.body;

        const result = await query(
          `UPDATE properties 
           SET title = $1, description = $2, price = $3, location = $4, bedrooms = $5, 
               bathrooms = $6, guests = $7, image = $8, amenities = $9, available = $10,
               ical_export_url = $11, airbnb_import_url = $12, booking_import_url = $13,
               vrbo_import_url = $14, calendar_sync_enabled = $15
           WHERE id = $16 RETURNING *`,
          [title, description, price, location, bedrooms, bathrooms, guests, image, amenities, available,
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

    // Collection operations (when no ID is provided)
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM properties WHERE available = true ORDER BY created_at DESC');
      return res.status(200).json(result.rows.map(transformProperty));
    }

    if (req.method === 'POST') {
      const { 
        title, 
        description, 
        price, 
        location, 
        bedrooms, 
        bathrooms, 
        guests, 
        image, 
        amenities,
        ical_export_url,
        airbnb_import_url,
        booking_import_url,
        vrbo_import_url,
        calendar_sync_enabled
      } = req.body;

      const result = await query(
        `INSERT INTO properties 
         (title, description, price, location, bedrooms, bathrooms, guests, image, amenities,
          ical_export_url, airbnb_import_url, booking_import_url, vrbo_import_url, calendar_sync_enabled) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
        [title, description, price, location, bedrooms, bathrooms, guests, image, amenities,
         ical_export_url, airbnb_import_url, booking_import_url, vrbo_import_url, calendar_sync_enabled]
      );

      return res.status(200).json(transformProperty(result.rows[0]));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Properties API error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}