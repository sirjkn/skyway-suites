import { Pool } from 'pg';
import { ENV } from './env';

// Singleton connection pool
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || ENV.DATABASE_URL;
    
    console.log('🔌 Initializing database connection to Neon...');
    console.log('📍 Connection URL present:', !!connectionString);
    console.log('🌐 Environment:', process.env.VERCEL ? 'Vercel Production' : 'Development');
    
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: ENV.DB_POOL.max,
      idleTimeoutMillis: ENV.DB_POOL.idleTimeoutMillis,
      connectionTimeoutMillis: ENV.DB_POOL.connectionTimeoutMillis,
    });
    
    // Add error handler to pool
    pool.on('error', (err) => {
      console.error('❌ Unexpected database pool error:', err);
    });
    
    pool.on('connect', () => {
      console.log('✅ New database client connected to Neon');
    });
    
    console.log('✅ Database pool initialized with Neon PostgreSQL');
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