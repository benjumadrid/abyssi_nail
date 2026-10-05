import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// GET Admin Dashboard Key Metrics & Statistics
router.get('/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT
        COUNT(*) AS total_orders,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_orders,
        COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_orders,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_orders,
        COUNT(*) FILTER (WHERE is_wedding_or_group = TRUE) AS group_orders,
        COUNT(*) FILTER (WHERE appointment_date = CURRENT_DATE) AS today_orders,
        COALESCE(SUM(negotiated_price) FILTER (WHERE status = 'confirmed' OR status = 'completed'), 0) AS total_revenue
      FROM registrations;
    `;

    const result = await pool.query(statsQuery);
    res.json({
      success: true,
      stats: result.rows[0],
      artist: {
        phone: process.env.ARTIST_PHONE || '+251956645851',
        telegram: process.env.ARTIST_TELEGRAM || 'Bonkersss',
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/change-password
router.post('/change-password', async (req, res) => {
  try {
    const { current_username, current_password, new_password, new_username } = req.body;

    if (!current_username || !current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current username, current password, and new password are required.'
      });
    }

    if (new_password.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    // Verify current credentials against DB
    const adminCheck = await pool.query(
      'SELECT id, username, password FROM admins WHERE username = $1 AND password = $2',
      [current_username.trim(), current_password.trim()]
    );

    if (adminCheck.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Current username or password is incorrect.'
      });
    }

    const adminId = adminCheck.rows[0].id;
    const finalUsername = new_username && new_username.trim() ? new_username.trim() : current_username.trim();

    await pool.query(
      'UPDATE admins SET username = $1, password = $2 WHERE id = $3',
      [finalUsername, new_password.trim(), adminId]
    );

    res.json({
      success: true,
      message: 'Password updated successfully!',
      username: finalUsername
    });
  } catch (error) {
    console.error('Error updating admin password:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error updating password' });
  }
});

export default router;
