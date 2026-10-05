require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query(`
      UPDATE services 
      SET image_url = '/uploads/classic_pedicure_perfect.jpg',
          description = 'Basic toenail care including soothing foot bath, precision trimming, shaping, cuticle nourishment, light callus smoothing, and neat regular polish.'
      WHERE id = 9;

      UPDATE services 
      SET image_url = '/uploads/gel-pedicure-art.jpg',
          description = 'Vibrant rich gel polish adorned with genuine 24K gold foil flakes, delicate hand-painted gold line art, and dazzling Swarovski crystal studs cured to perfection.'
      WHERE id = 10;

      UPDATE services 
      SET image_url = '/uploads/french-pedicure-art.jpg',
          description = 'Timeless crisp French tips elevated with bespoke salon nail art: featuring a hand-crafted 3D golden butterfly charm, sparkling Swarovski crystal tiara, and glass-like gloss.'
      WHERE id = 11;

      UPDATE services 
      SET image_url = '/uploads/luxury_floral_glitter_pedicure.jpg',
          description = 'Royal indulgence combining deluxe foot therapy with hand-painted 3D sculpted floral petals, dazzling 24k gold glitter accents, and sparkling Swarovski crystals.'
      WHERE id = 13;

      UPDATE services 
      SET image_url = '/uploads/pedicure_nail_art_clean.jpg',
          description = 'Bespoke toenail artistry tailored to your style: choose from 3D botanical flowers, glitter cascades, chrome butterflies, diamond studs, or trendy custom patterns.'
      WHERE id = 14;
    `);

    const res = await pool.query("SELECT id, name, category, image_url, description FROM services WHERE category = 'Leg' ORDER BY id;");
    console.log("UPDATED_SERVICES_COUNT:", res.rows.length);
    res.rows.forEach(r => console.log(`[${r.id}] ${r.name} -> ${r.image_url}`));
  } catch (err) {
    console.error("Error updating services:", err);
  } finally {
    await pool.end();
  }
}

run();
