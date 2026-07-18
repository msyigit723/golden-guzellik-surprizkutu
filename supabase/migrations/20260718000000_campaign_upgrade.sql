-- 1. Add slug to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS slug VARCHAR(50);

-- 2. Backfill existing campaigns
-- Assign 'wheel' to the main legacy campaign. If there are multiple nulls, only the first one gets 'wheel' 
-- to prevent UNIQUE constraint violations.
UPDATE campaigns 
SET slug = 'wheel' 
WHERE id = (SELECT id FROM campaigns WHERE slug IS NULL ORDER BY created_at ASC LIMIT 1);

-- For any other legacy campaigns, give them a unique slug
UPDATE campaigns 
SET slug = 'legacy_' || substr(id::text, 1, 8) 
WHERE slug IS NULL;

-- Make slug unique going forward
ALTER TABLE campaigns ADD CONSTRAINT campaigns_slug_key UNIQUE (slug);

-- 3. Add campaign_slug to spins, prizes, and spin_sonuçları
ALTER TABLE spins ADD COLUMN IF NOT EXISTS campaign_slug VARCHAR(50);
ALTER TABLE prizes ADD COLUMN IF NOT EXISTS campaign_slug VARCHAR(50);
ALTER TABLE spin_sonuçları ADD COLUMN IF NOT EXISTS campaign_slug VARCHAR(50);

-- 4. Backfill existing records based on their relational campaign_id
UPDATE spins 
SET campaign_slug = c.slug 
FROM campaigns c 
WHERE spins.campaign_id = c.id AND spins.campaign_slug IS NULL;

UPDATE prizes 
SET campaign_slug = c.slug 
FROM campaigns c 
WHERE prizes.campaign_id = c.id AND prizes.campaign_slug IS NULL;

UPDATE spin_sonuçları 
SET campaign_slug = c.slug 
FROM campaigns c 
WHERE spin_sonuçları.campaign_id = c.id AND spin_sonuçları.campaign_slug IS NULL;

-- 5. Drop the UNIQUE constraint on spins(user_id) because a user can now play multiple campaigns
ALTER TABLE spins DROP CONSTRAINT IF EXISTS spins_user_id_key;
ALTER TABLE spins ADD CONSTRAINT spins_user_id_campaign_id_key UNIQUE (user_id, campaign_id);

-- 6. Insert the new active campaign.
-- Note: the 'trigger_single_active_campaign' trigger will automatically deactivate the 'wheel' 
-- campaign when this new one is inserted with active = true.
INSERT INTO campaigns (title, slug, active, probability)
VALUES ('Golden Güzellik Sürpriz Kutu', 'surpriz_kutu', true, 1.0)
ON CONFLICT (slug) DO NOTHING;

-- 7. Replace claim_prize RPC to support campaign_slug and check user_id + campaign_id
CREATE OR REPLACE FUNCTION claim_prize(p_user_id UUID, p_campaign_id UUID, p_campaign_slug VARCHAR, p_prize_id UUID)
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
  -- Check if already spun IN THIS CAMPAIGN ONLY
  IF EXISTS (SELECT 1 FROM spins WHERE user_id = p_user_id AND campaign_id = p_campaign_id) THEN
    RETURN json_build_object('success', false, 'error', 'already_spun');
  END IF;

  -- Lock the prize row for update to prevent concurrent stock depletion
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

  -- Record the spin
  INSERT INTO spins (user_id, campaign_id, campaign_slug, prize_id) 
  VALUES (p_user_id, p_campaign_id, p_campaign_slug, p_prize_id);

  -- Record the detailed snapshot in `spin_sonuçları`
  INSERT INTO spin_sonuçları (
    user_id, campaign_id, campaign_slug, prize_id, 
    user_name_snapshot, user_surname_snapshot, user_phone_snapshot,
    prize_title_snapshot, probability_snapshot, color_snapshot, 
    icon_snapshot, image_snapshot
  ) VALUES (
    p_user_id, p_campaign_id, p_campaign_slug, p_prize_id,
    v_user_name, v_user_surname, v_user_phone,
    v_prize_title, v_probability, v_bg_color, 
    v_icon, v_image_url
  );

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
