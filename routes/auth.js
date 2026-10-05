import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const result = await pool.query(
      'SELECT id, username, name FROM admins WHERE username = $1 AND password = $2',
      [username.trim(), password.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const admin = result.rows[0];
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
