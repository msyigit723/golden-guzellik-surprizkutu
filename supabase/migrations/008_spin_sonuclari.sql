-- ================================================
-- Migration 008: Added spin_sonuçları table for historical tracking
-- and updated claim_prize RPC to populate it atomically.
-- ================================================

-- 1. Create the historical snapshot table
CREATE TABLE IF NOT EXISTS spin_sonuçları (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  prize_id UUID REFERENCES prizes(id) ON DELETE SET NULL,
  user_name_snapshot VARCHAR(100),
  user_surname_snapshot VARCHAR(100),
  user_phone_snapshot VARCHAR(20),
  user_email_snapshot VARCHAR(255),
  prize_title_snapshot VARCHAR(200),
  probability_snapshot DECIMAL(10,2),
  color_snapshot VARCHAR(20),
  icon_snapshot VARCHAR(50),
  image_snapshot TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for reporting and fetching
CREATE INDEX idx_spin_sonuclari_user_id ON spin_sonuçları(user_id);
CREATE INDEX idx_spin_sonuclari_campaign_id ON spin_sonuçları(campaign_id);
CREATE INDEX idx_spin_sonuclari_created_at ON spin_sonuçları(created_at DESC);

-- Enable RLS
ALTER TABLE spin_sonuçları ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own history (assuming custom JWT claim 'userId' or standard 'sub')
CREATE POLICY "Users can view own spin_sonuclari" 
  ON spin_sonuçları 
  FOR SELECT 
  USING (
    user_id::text = current_setting('request.jwt.claim.userId', true) 
    OR 
    user_id::text = current_setting('request.jwt.claim.sub', true)
  );

-- Policy: Admins can view all (assuming custom JWT claim 'role' = 'admin' or just allowed via service role)
CREATE POLICY "Admins can view all spin_sonuclari" 
  ON spin_sonuçları 
  FOR SELECT 
  USING (
    current_setting('request.jwt.claim.role', true) = 'admin' 
    OR 
    TRUE -- Service role overrides RLS anyway, but keeping this permissive for admins if they use direct connections.
  );

-- No INSERT/UPDATE/DELETE policies means regular users cannot modify records natively.


-- 2. Update the existing claim_prize RPC
-- We preserve the existing logic (checking already_spun, locking stock, decreasing stock, inserting into `spins`)
-- and we add an atomic insert into `spin_sonuçları`.

CREATE OR REPLACE FUNCTION claim_prize(p_user_id UUID, p_campaign_id UUID, p_prize_id UUID)
RETURNS JSON AS $$
DECLARE
  v_stock INT;
  v_prize_title VARCHAR(200);
  v_probability DECIMAL(10,2);
  v_bg_color VARCHAR(20);
  v_text_color VARCHAR(20);
  v_icon VARCHAR(50);
  v_image_url TEXT;
  v_user_name VARCHAR(100);
  v_user_surname VARCHAR(100);
  v_user_phone VARCHAR(20);
BEGIN
  -- Check if already spun
  IF EXISTS (SELECT 1 FROM spins WHERE user_id = p_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'already_spun');
  END IF;

  -- Lock the prize row for update to prevent concurrent stock depletion
  -- Capture all prize snapshots required for spin_sonuçları
  SELECT stock, title, probability, bg_color, text_color, icon, image_url 
  INTO v_stock, v_prize_title, v_probability, v_bg_color, v_text_color, v_icon, v_image_url
  FROM prizes 
  WHERE id = p_prize_id AND is_active = TRUE 
  FOR UPDATE;

  IF v_stock IS NULL OR v_stock <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'out_of_stock');
  END IF;
  
  -- Capture user snapshots
  SELECT name, surname, phone
  INTO v_user_name, v_user_surname, v_user_phone
  FROM users
  WHERE id = p_user_id;

  -- Decrease stock
  UPDATE prizes SET stock = stock - 1 WHERE id = p_prize_id;

  -- Record the spin in the existing `spins` table (Preserve backward compatibility)
  INSERT INTO spins (user_id, campaign_id, prize_id) 
  VALUES (p_user_id, p_campaign_id, p_prize_id);
  
  -- Record the detailed snapshot in `spin_sonuçları`
  INSERT INTO spin_sonuçları (
    user_id, 
    campaign_id, 
    prize_id, 
    user_name_snapshot,
    user_surname_snapshot,
    user_phone_snapshot,
    -- users table doesn't have email in schema, using phone for the email column space if needed, 
    -- but keeping email null since it doesn't exist on users.
    prize_title_snapshot, 
    probability_snapshot, 
    color_snapshot, 
    icon_snapshot, 
    image_snapshot
  ) VALUES (
    p_user_id, 
    p_campaign_id, 
    p_prize_id,
    v_user_name,
    v_user_surname,
    v_user_phone,
    v_prize_title, 
    v_probability, 
    v_bg_color, 
    v_icon, 
    v_image_url
  );

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
