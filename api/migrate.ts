import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './config/db.js';

/**
 * Database migration endpoint
 * This endpoint adds the categorized_photos column to the properties table
 * 
 * Usage: Visit /api/migrate to run the migration
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('🔄 Starting database migration...');
    
    // Add categorized_photos column if it doesn't exist
    await query(`
      ALTER TABLE properties 
      ADD COLUMN IF NOT EXISTS categorized_photos JSONB DEFAULT '{}'::jsonb
    `);
    
    console.log('✅ Migration completed successfully');
    
    return res.status(200).json({ 
      success: true, 
      message: 'Migration completed successfully. The categorized_photos column has been added to the properties table.' 
    });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}
