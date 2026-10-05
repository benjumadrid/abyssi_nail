import pool from '../config/db.js';

const newServices = [
  // 3 Hand Nail Arts
  {
    name: 'Ombré Butterfly Art',
    category: 'Hand',
    description: 'Soft blush pink into milky white ombré gradient accented with delicate hand-painted holographic butterfly wings and Swarovski crystals.',
    image_url: '/uploads/ombre-nails.jpg'
  },
  {
    name: 'Chrome / Glazed Donut',
    category: 'Hand',
    description: 'Ultra-fine pearlescent or metallic chrome powder buffed over gel polish for an iconic iridescent mirror reflection.',
    image_url: '/uploads/chrome-glazed-nails.jpg'
  },
  {
    name: 'Marble & Quartz Art',
    category: 'Hand',
    description: 'Realistic hand-painted smoky marble veins and rose quartz patterns, delicately accented with 24k gold leaf foil flakes.',
    image_url: '/uploads/marble-quartz-nails.jpg'
  },
  // High-End Leg Nail Arts
  {
    name: 'Chrome / Glazed Pedicure',
    category: 'Leg',
    description: 'Ultra-fine iridescent pearl chrome powder buffed over milky gel for an iconic liquid glass mirror shine on toes.',
    image_url: '/uploads/chrome-pedicure.jpg'
  },
  {
    name: 'Crystal & Diamond Glam Pedicure',
    category: 'Leg',
    description: 'Hand-set Swarovski-style crystal clusters, diamond rhinestones, and luxury pearls on the big toe with pristine milky gel.',
    image_url: '/uploads/crystal-pedicure.jpg'
  },
  {
    name: '3D Floral & Botanical Pedicure',
    category: 'Leg',
    description: 'Delicate hand-painted 3D sculpted floral petals, blooming blossoms, and metallic gold leaf foil branches on the big toe.',
    image_url: '/uploads/floral-pedicure.jpg'
  },
  {
    name: 'Marble & Gold Leaf Pedicure',
    category: 'Leg',
    description: 'Smoky hand-painted Italian quartz marble swirls infused with dazzling 24k gold leaf foil veins on toes.',
    image_url: '/uploads/marble-pedicure.jpg'
  }
];

async function seed() {
  try {
    // Remove Spa Pedicure (which looked identical to French Pedicure) and other plain entries
    await pool.query("DELETE FROM services WHERE name IN ('Spa Pedicure', 'Paraffin Wax Pedicure', 'Jelly Spa Pedicure')");
    await pool.query("UPDATE services SET name = 'Ombré Butterfly Art' WHERE name = 'Ombré / Baby Boomer'");
    console.log('✓ Removed Spa Pedicure and updated Ombre name');

    for (const s of newServices) {
      const existing = await pool.query('SELECT id FROM services WHERE name = $1', [s.name]);
      if (existing.rows.length === 0) {
        await pool.query(
          'INSERT INTO services (name, category, description, image_url) VALUES ($1, $2, $3, $4)',
          [s.name, s.category, s.description, s.image_url]
        );
        console.log('✓ Inserted:', s.name);
      } else {
        await pool.query(
          'UPDATE services SET category = $2, description = $3, image_url = $4 WHERE id = $1',
          [existing.rows[0].id, s.category, s.description, s.image_url]
        );
        console.log('✓ Updated:', s.name);
      }
    }

    const all = await pool.query('SELECT id, name, category, image_url FROM services ORDER BY category, id');
    console.log(`\n🎉 Success! Total services in database now: ${all.rows.length}`);
    console.table(all.rows);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await pool.end();
  }
}

seed();
