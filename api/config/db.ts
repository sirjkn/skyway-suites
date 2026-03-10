import { Pool, neonConfig } from '@neondatabase/serverless';
import { ENV } from './env.js';

// Configure Neon for serverless (uses fetch instead of WebSockets)
neonConfig.fetchConnectionCache = true;

// Singleton connection pool
let pool: Pool | null = null;

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