-- ═══════════════════════════════════════════════════════════════
-- Fix Hospitals Table - Add Missing Columns
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Add missing columns to hospitals table
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS specialties text[];
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS beds_total integer DEFAULT 0;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS beds_available integer DEFAULT 0;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS emergency_services boolean DEFAULT true;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'hospitals' 
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Hospitals table updated successfully';
  RAISE NOTICE '✅ City column added';
  RAISE NOTICE '✅ All missing columns added';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 You can now register hospitals!';
END $$;
