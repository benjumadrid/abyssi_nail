import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetAdmin() {
  const targetUsername = process.argv[2] || 'admin';
  const targetPassword = process.argv[3] || 'abyssi2026';

  try {
    console.log(`🔄 Updating Beauty Abyssi Admin Credentials in database...`);

    const check = await pool.query('SELECT id FROM admins LIMIT 1;');
    if (check.rows.length > 0) {
      await pool.query(
        "UPDATE admins SET username = $1, password = $2, name = 'Beauty Abyssi Owner' WHERE id = $3;",
        [targetUsername, targetPassword, check.rows[0].id]
      );
    } else {
      await pool.query(
        "INSERT INTO admins (username, password, name) VALUES ($1, $2, 'Beauty Abyssi Owner');",
        [targetUsername, targetPassword]
      );
    }

    console.log('\n===========================================');
    console.log('✨ Admin credentials successfully updated!');
    console.log(`👤 Username : ${targetUsername}`);
    console.log(`🔑 Password : ${targetPassword}`);
    console.log('===========================================\n');
  } catch (err) {
    console.error('❌ Error resetting admin credentials:', err.message);
  } finally {
    await pool.end();
  }
}

resetAdmin();
