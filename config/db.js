import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Neon PostgreSQL connection configuration
// Neon requires SSL connection string
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️ WARNING: DATABASE_URL is not set in .env file.');
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for Neon cloud connection
  },
});

// Gracefully handle idle client disconnections common with serverless Neon
pool.on('error', (err) => {
  console.warn('⚠️ Neon pool idle socket reconnecting:', err.message);
});

// Test connection helper
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, current_database() as database');
    // Ensure client_address column exists and appointment_time has plenty of room
    await client.query('ALTER TABLE registrations ADD COLUMN IF NOT EXISTS client_address VARCHAR(255);');
    await client.query('ALTER TABLE registrations ALTER COLUMN appointment_time TYPE VARCHAR(100);');
    await client.query('ALTER TABLE registrations ALTER COLUMN inspo_image_url TYPE TEXT;');
    await client.query('ALTER TABLE registrations ADD COLUMN IF NOT EXISTS group_members TEXT;');
    await client.query('ALTER TABLE registrations ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;');
    client.release();
    console.log('✅ Connected to Neon PostgreSQL database successfully!');
    console.log(`📌 Database: ${result.rows[0].database} | Server Time: ${result.rows[0].current_time}`);
    return { success: true, ...result.rows[0] };
  } catch (error) {
    console.error('❌ Neon Database connection failed:', error.message);
    return { success: false, error: error.message };
  }
};

export default pool;
