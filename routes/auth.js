import express from 'express';
import { pool } from '../config/db.js';
import { verifyPassword, hashPassword } from '../utils/security.js';

const router = express.Router();

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const result = await pool.query(
      'SELECT id, username, name, password FROM admins WHERE username = $1',
      [username.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const admin = result.rows[0];
    const isMatch = verifyPassword(password.trim(), admin.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Auto-upgrade legacy plain text password to cryptographic scrypt hash in the database
    if (admin.password && !admin.password.includes(':')) {
      try {
        const secureHash = hashPassword(password.trim());
        await pool.query('UPDATE admins SET password = $1 WHERE id = $2', [secureHash, admin.id]);
        console.log(`[Security] Upgraded legacy plain text password to scrypt hash for admin: ${admin.username}`);
      } catch (upgradeErr) {
        console.error('[Security] Note: Could not auto-upgrade password hash in DB:', upgradeErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Login successful!',
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
      },
      token: `abyssi_token_${admin.id}_${Date.now()}`,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
