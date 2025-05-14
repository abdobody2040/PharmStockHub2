import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../shared/schema';
import ws from 'ws';

// Configure Neon to use WebSocket
neonConfig.webSocketConstructor = ws;

// Create database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

// Function to execute SQL directly
async function executeSQL(sql: string): Promise<void> {
  await pool.query(sql);
}

// Main migration function
async function runMigration() {
  console.log('Starting database migration...');

  try {
    // Create specialties table
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS specialties (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created specialties table');

    // Add specialty_id column to users table if it doesn't exist
    await executeSQL(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'specialty_id'
        ) THEN
          ALTER TABLE users ADD COLUMN specialty_id INTEGER REFERENCES specialties(id);
        END IF;
      END
      $$;
    `);
    console.log('Added specialty_id to users table');

    // Add specialty_id column to stock_items table if it doesn't exist
    await executeSQL(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'stock_items' AND column_name = 'specialty_id'
        ) THEN
          ALTER TABLE stock_items ADD COLUMN specialty_id INTEGER REFERENCES specialties(id);
        END IF;
      END
      $$;
    `);
    console.log('Added specialty_id to stock_items table');

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration();