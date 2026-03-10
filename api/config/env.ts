/**
 * Hardcoded Environment Configuration for Skyway Suites
 * 
 * These values are used as defaults and can be overridden by actual environment variables
 */

export const ENV = {
  // Neon Database Connection
  DATABASE_URL: 'postgresql://neondb_owner:npg_aJ8wfM4RIeTQ@ep-floral-leaf-ag3dpaau-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  
  // JWT Authentication Secret
  JWT_SECRET: 'skyway-suites-secret-key-2026-production-change-this',
  
  // Server Port (for local development)
  PORT: 3000,
  
  // Database Pool Configuration
  DB_POOL: {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  
  // JWT Token Configuration
  JWT_EXPIRES_IN: '7d',
} as const;

/**
 * Get environment variable with fallback to hardcoded value
 */
export function getEnv(key: keyof typeof ENV): any {
  return process.env[key] || ENV[key];
}