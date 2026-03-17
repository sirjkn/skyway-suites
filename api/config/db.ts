import { Pool, neonConfig } from '@neondatabase/serverless';
import { ENV } from './env.js';
import ws from 'ws';

// Configure Neon for Vercel serverless environment
neonConfig.fetchConnectionCache = true;

// Use ws package for WebSocket connections in Node.js environment
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

// Singleton connection pool
let pool: Pool | null = null;
let migrationRun = false;

// Auto-migration: Create missing tables on startup
async function runMigrations(pool: Pool) {
  if (migrationRun) return;
  
  try {
    console.log('🔄 Checking for required database tables...');
    
    // Create M-Pesa transactions table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mpesa_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        checkout_request_id VARCHAR(255) UNIQUE NOT NULL,
        booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
        phone_number VARCHAR(20) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        mpesa_receipt_number VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_mpesa_checkout_request ON mpesa_transactions(checkout_request_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_mpesa_booking ON mpesa_transactions(booking_id);
    `);
    
    // Add transaction_id to payments table if it doesn't exist
    await pool.query(`
      ALTER TABLE payments 
      ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
    `);
    
    console.log('✅ Database migrations completed successfully');
    migrationRun = true;
  } catch (error) {
    console.error('⚠️ Migration error (may be safe to ignore if tables exist):', error);
    // Don't throw - continue even if migrations fail
    migrationRun = true; // Mark as run to avoid retry loops
  }
}

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || ENV.DATABASE_URL;
    
    console.log('🔌 Initializing Neon serverless database connection...');
    console.log('📍 Connection URL present:', !!connectionString);
    console.log('📍 Connection URL (masked):', connectionString?.replace(/:[^:@]+@/, ':****@'));
    console.log('🌐 Environment:', process.env.VERCEL ? 'Vercel Production' : 'Development');
    
    pool = new Pool({
      connectionString,
      max: ENV.DB_POOL.max,
      idleTimeoutMillis: ENV.DB_POOL.idleTimeoutMillis,
      connectionTimeoutMillis: ENV.DB_POOL.connectionTimeoutMillis,
    });
    
    // Test connection on initialization
    pool.query('SELECT NOW()')
      .then(() => console.log('✅ Neon serverless database pool initialized and tested'))
      .catch((err) => console.error('❌ Neon database connection test failed:', err.message));
    
    // Run migrations
    runMigrations(pool);
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const pool = getPool();
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('✓ Query executed', { duration, rows: res.rowCount });
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('❌ Query failed', { text, duration, error: String(error) });
    throw error;
  }
}

// Export function to ensure migrations run
export async function ensureMigrationsRun() {
  const pool = getPool();
  await runMigrations(pool);
}