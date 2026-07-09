-- ================================================
-- Golden Beauty Spin — Database Schema
-- ================================================
-- Run this SQL in your Supabase SQL Editor to create
-- all required tables, indexes, and seed data.
-- ================================================

-- Enable UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================
-- USERS TABLE
-- ================================================
-- No has_spun column: spin status is derived from spin_results.
-- This enables future scalability for multiple spins,
-- weekly/monthly campaigns, and promotional extra spins.
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  surname VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ================================================
-- ADMINS TABLE
-- ================================================
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================
-- CAMPAIGNS TABLE
-- ================================================
-- display_order controls the visual positioning of segments
-- on the wheel. Admins can reorder without changing logic.
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  probability DECIMAL(5,2) NOT NULL CHECK (probability >= 0 AND probability <= 100),
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_active_order ON campaigns(active, display_order);

-- ================================================
-- SPIN RESULTS TABLE
-- ================================================
-- campaign_name_snapshot preserves the campaign title at
-- the time of the spin. If the admin later renames the
-- campaign, historical records remain accurate.
CREATE TABLE spin_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  campaign_name_snapshot TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_spin_results_user ON spin_results(user_id);
CREATE INDEX idx_spin_results_campaign ON spin_results(campaign_id);
CREATE INDEX idx_spin_results_created_at ON spin_results(created_at DESC);

-- ================================================
-- SEED: Default Admin
-- ================================================
-- Password: admin123 (bcrypt hash with 12 rounds)
-- IMPORTANT: Change this password immediately in production!
INSERT INTO admins (username, password_hash) VALUES (
  'admin',
  '$2a$12$LJ3m4ys3GZfnMQXYKx6Oj.4YqGkZqX5jNwVQ8K3YhKzXz3qXzKp6'
);

-- ================================================
-- SEED: Sample Campaigns
-- ================================================
INSERT INTO campaigns (title, description, probability, display_order, active) VALUES
  ('Ücretsiz Cilt Bakımı', 'Profesyonel cilt bakım seansı hediye', 15.00, 1, true),
  ('Saç Bakım Paketi', 'Komple saç bakım ve onarım paketi', 10.00, 2, true),
  ('Manikür & Pedikür', 'Lüks manikür ve pedikür hizmeti', 20.00, 3, true),
  ('Masaj Terapisi', '60 dakikalık relax masaj seansı', 10.00, 4, true),
  ('Kaş Tasarımı', 'Profesyonel kaş tasarımı ve şekillendirme', 25.00, 5, true),
  ('VIP Güzellik Paketi', 'Tüm hizmetlerden oluşan VIP paket', 5.00, 6, true);
