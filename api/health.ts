import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './config/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS and set Content-Type
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🏥 Health check starting...');
    
    // Test database connection with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout after 5 seconds')), 5000);
    });
    
    const queryPromise = query('SELECT NOW() as time, version() as version');
    
    const result = await Promise.race([queryPromise, timeoutPromise]) as any;
    
    console.log('✅ Health check successful');
    
    return res.status(200).json({
      status: 'ok',
      database: 'connected',
      message: 'Skyway Suites API is running',
      timestamp: new Date().toISOString(),
      dbTime: result.rows[0].time,
      dbVersion: result.rows[0].version.split(' ')[0],
      environment: process.env.VERCEL ? 'production' : 'development'
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    // Provide detailed error information
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = {
      status: 'error',
      database: 'disconnected',
      message: 'Database connection failed',
      error: errorMessage,
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL ? 'production' : 'development',
      troubleshooting: {
        checkDatabaseUrl: 'Verify DATABASE_URL is set in Vercel environment variables',
        checkNeonStatus: 'Verify Neon database is active and not suspended',
        checkSSL: 'Ensure SSL connection is properly configured',
        checkPooler: 'Verify using Neon pooler endpoint (ends with -pooler)'
      }
    };
    
    return res.status(500).json(errorDetails);
  }
}