import express from 'express';
import { pool } from '../config/db.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// GET all nail works
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = `
      SELECT nw.*, s.name as service_name 
      FROM nail_works nw
      LEFT JOIN services s ON nw.service_id = s.id
    `;
    const params = [];

    if (category) {
      params.push(category);
      query += ` WHERE nw.category ILIKE $${params.length}`;
    }

    if (search) {
      const searchParam = `%${search}%`;
      params.push(searchParam);
      query += params.length === 1 
        ? ` WHERE (nw.title ILIKE $1 OR nw.client_name ILIKE $1 OR nw.artist_name ILIKE $1)`
        : ` AND (nw.title ILIKE $2 OR nw.client_name ILIKE $2 OR nw.artist_name ILIKE $2)`;
    }

    query += ' ORDER BY nw.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('Error fetching nail works:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET nail work by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT nw.*, s.name as service_name 
       FROM nail_works nw
       LEFT JOIN services s ON nw.service_id = s.id
       WHERE nw.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Nail work not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching nail work:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST register a new nail work (supports both JSON and multipart form-data image upload)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      client_name,
      artist_name,
      category,
      service_id,
      price,
      description,
    } = req.body;

    let image_url = req.body.image_url;
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const query = `
      INSERT INTO nail_works (
        title, client_name, artist_name, category, service_id, price, description, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      title,
      client_name || 'Walk-in Client',
      artist_name || 'Master Artist',
      category || 'Nail Art',
      service_id ? parseInt(service_id, 10) : null,
      price ? parseFloat(price) : 0,
      description || '',
      image_url || 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80',
    ];

    const result = await pool.query(query, values);
    res.status(201).json({
      success: true,
      message: 'Nail work registered successfully!',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error registering nail work:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update nail work
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      client_name,
      artist_name,
      category,
      service_id,
      price,
      description,
      image_url,
    } = req.body;

    const query = `
      UPDATE nail_works
      SET title = COALESCE($1, title),
          client_name = COALESCE($2, client_name),
          artist_name = COALESCE($3, artist_name),
          category = COALESCE($4, category),
          service_id = COALESCE($5, service_id),
          price = COALESCE($6, price),
          description = COALESCE($7, description),
          image_url = COALESCE($8, image_url)
      WHERE id = $9
      RETURNING *
    `;

    const values = [title, client_name, artist_name, category, service_id, price, description, image_url, id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Nail work not found' });
    }

    res.json({
      success: true,
      message: 'Nail work updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating nail work:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE nail work
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM nail_works WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Nail work not found' });
    }

    res.json({ success: true, message: 'Nail work deleted successfully' });
  } catch (error) {
    console.error('Error deleting nail work:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
