import { testConnection, pool } from '../config/db.js';

async function run() {
  console.log('🔍 Testing connection to Neon Database...');
  const res = await testConnection();
  if (res.success) {
    console.log('🎉 Successfully connected to Neon!');
  } else {
    console.error('⚠️ Could not connect. Please ensure your DATABASE_URL in .env is correct.');
  }
  await pool.end();
}

run();
