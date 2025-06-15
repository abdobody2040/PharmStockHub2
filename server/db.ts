import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  min: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  allowExitOnIdle: false,
});

// Handle pool errors with better logging
pool.on('error', (err: any) => {
  console.error('Database pool error:', err.message);
  if ('code' in err && err.code === '57P01') {
    console.log('Database connection terminated by administrator, will reconnect automatically');
  }
});

pool.on('connect', () => {
  console.log('Database connection established');
});

export const db = drizzle(pool, { schema });