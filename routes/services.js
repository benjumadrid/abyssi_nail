import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// GET all salon services (with optional category filter)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM services';
    const params = [];

    if (category && category.toLowerCase() !== 'all') {
      params.push(category);
      query += ' WHERE LOWER(category) = LOWER($1)';
    }

    query += ' ORDER BY id ASC';

    const result = await pool.query(query, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single service by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
