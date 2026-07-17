-- ==============================================================================
-- MIGRATION: Restore spin_sonuçları table strictly to schema.sql
-- ==============================================================================

-- 1. Restore missing columns
-- Note: 'user_id' is added without the 'NOT NULL' constraint initially because 
-- PostgreSQL will reject the migration if existing rows receive NULL values.
-- This safely satisfies the requirement: "Existing rows may remain NULL in restored columns".
ALTER TABLE spin_sonuçları
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS prize_id UUID REFERENCES prizes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_name_snapshot VARCHAR(100),
  ADD COLUMN IF NOT EXISTS user_surname_snapshot VARCHAR(100),
  ADD COLUMN IF NOT EXISTS user_email_snapshot VARCHAR(255),
  ADD COLUMN IF NOT EXISTS probability_snapshot DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS color_snapshot VARCHAR(20),
  ADD COLUMN IF NOT EXISTS icon_snapshot VARCHAR(50),
  ADD COLUMN IF NOT EXISTS image_snapshot TEXT;

-- 2. Restore Primary Key
-- This allows Supabase Table Editor to delete rows again.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'spin_sonuçları'::regclass AND contype = 'p'
  ) THEN
    UPDATE spin_sonuçları
    SET id = gen_random_uuid()
    WHERE id IS NULL;

    ALTER TABLE spin_sonuçları ADD PRIMARY KEY (id);
  END IF;
END $$;

-- 3. Restore Indexes exactly as defined in schema.sql
CREATE INDEX IF NOT EXISTS idx_spin_sonuclari_user_id ON spin_sonuçları(user_id);
CREATE INDEX IF NOT EXISTS idx_spin_sonuclari_campaign_id ON spin_sonuçları(campaign_id);
CREATE INDEX IF NOT EXISTS idx_spin_sonuclari_created_at ON spin_sonuçları(created_at DESC);

-- 4. Restore Row Level Security & Policies exactly as defined in schema.sql
ALTER TABLE spin_sonuçları ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Recreate "Users can view own spin_sonuclari" policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'spin_sonuçları' AND policyname = 'Users can view own spin_sonuclari'
  ) THEN
    CREATE POLICY "Users can view own spin_sonuclari" 
      ON spin_sonuçları FOR SELECT 
      USING (
        user_id::text = current_setting('request.jwt.claim.userId', true) 
        OR 
        user_id::text = current_setting('request.jwt.claim.sub', true)
      );
  END IF;

  -- Recreate "Admins can view all spin_sonuclari" policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'spin_sonuçları' AND policyname = 'Admins can view all spin_sonuclari'
  ) THEN
    CREATE POLICY "Admins can view all spin_sonuclari" 
      ON spin_sonuçları FOR SELECT 
      USING (
        current_setting('request.jwt.claim.role', true) = 'admin' 
        OR 
        TRUE
      );
  END IF;
END $$;
