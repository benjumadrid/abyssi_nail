import { pool } from '../config/db.js';

const schemaSQL = `
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS nail_works CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(60) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  name VARCHAR(100) DEFAULT 'Beauty Abyssi Owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL, -- 'Hand' or 'Leg'
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE nail_works (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  category VARCHAR(60) NOT NULL,
  artist_name VARCHAR(100) DEFAULT 'Beauty Abyssi Nail Artist',
  client_name VARCHAR(100),
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE registrations (
  id SERIAL PRIMARY KEY,
  client_name VARCHAR(120) NOT NULL,
  client_phone VARCHAR(50) NOT NULL,
  client_email VARCHAR(120),
  category_type VARCHAR(60) DEFAULT 'Hand & Leg',
  services_selected TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time VARCHAR(30) NOT NULL,
  is_wedding_or_group BOOLEAN DEFAULT FALSE,
  group_size INT DEFAULT 1,
  inspo_image_url TEXT,
  notes TEXT,
  negotiated_price NUMERIC(10, 2),
  status VARCHAR(30) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

const seedSQL = `
INSERT INTO admins (username, password, name)
VALUES ('admin', 'abyssi2026', 'Beauty Abyssi Owner');

-- Exact Hand Services (Removed 'Nail Art' as requested)
INSERT INTO services (name, category, description, image_url) VALUES
('Classic Manicure', 'Hand', 'Clean, shape, buff, cuticle care, and polish for neat, healthy-looking nails.', '/uploads/classic-manicure.jpg'),
('Gel Nail Polish', 'Hand', 'Long-lasting gel polish with a glossy finish, cured under a UV/LED lamp.', '/uploads/gel-nail.jpg'),
('French Tip', 'Hand', 'Classic natural-looking nails with clean white tips and a polished finish.', '/uploads/french-tip.jpg'),
('Cat Eye', 'Hand', 'Magnetic gel polish that creates a beautiful reflective "cat-eye" effect.', '/uploads/cat-eye.jpg'),
('Acrylic Nails', 'Hand', 'Durable nail extensions created with acrylic for added length, strength, and style.', '/uploads/acrylic-nails.jpg'),
('Nail Repair', 'Hand', 'Repairs broken, cracked, or damaged nails and restores their appearance.', '/uploads/nail-repair.jpg'),
('Nail Refill', 'Hand', 'Fills the grown-out area of acrylic or gel nails and refreshes the existing set.', '/uploads/nail-refill.jpg'),
('Luxury Nail Care', 'Hand', 'Premium nail treatment including detailed cuticle care, shaping, nourishment, and finishing.', '/uploads/luxury-nail-care.jpg'),

-- Exact Leg Services
('Classic Pedicure', 'Leg', 'Basic toenail care including soothing foot bath, precision trimming, shaping, cuticle nourishment, light callus smoothing, and neat regular polish.', '/uploads/classic_pedicure_perfect.jpg'),
('Gel Pedicure', 'Leg', 'Flawless high-shine gel pedicure cured under LED light, delivering an ultra-glossy, chip-resistant finish with lasting salon brilliance.', '/uploads/gel-pedicure-clean.jpg'),
('French Pedicure', 'Leg', 'Timeless French elegance featuring a delicate blush pink base seamlessly transitioning into clean, crisp milky white tips with glass-like gel gloss.', '/uploads/ombre-pedicure.jpg'),
('Luxury Pedicure', 'Leg', 'Royal indulgence combining deluxe foot therapy with hand-painted 3D sculpted floral petals, dazzling 24k gold glitter accents, and sparkling Swarovski crystals.', '/uploads/luxury_floral_glitter_pedicure.jpg'),
('Pedicure Nail Art', 'Leg', 'Bespoke toenail artistry tailored to your style: choose from 3D botanical flowers, glitter cascades, chrome butterflies, diamond studs, or trendy custom patterns.', '/uploads/pedicure_nail_art_clean.jpg');
`;

async function initDB() {
  try {
    await pool.query(schemaSQL);
    await pool.query(seedSQL);
    console.log('✅ Services table updated with exact names and descriptions for both Hand and Leg (Nail Art removed from Hand).');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  } finally {
    await pool.end();
  }
}

initDB();
