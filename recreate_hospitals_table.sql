-- ═══════════════════════════════════════════════════════════════
-- RECREATE Hospitals Table with All Required Columns
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Drop existing table (CAUTION: This will delete all hospital data!)
DROP TABLE IF EXISTS hospitals CASCADE;

-- Step 2: Create hospitals table with ALL required columns
CREATE TABLE hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  regNo text,
  city text,
  pincode text,
  contactPerson text,
  email text UNIQUE NOT NULL,
  phone text,
  password text NOT NULL,
  address text,
  specialties text[],
  beds_total integer DEFAULT 0,
  beds_available integer DEFAULT 0,
  emergency_services boolean DEFAULT true,
  active boolean DEFAULT true,
  createdAt timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 3: Create indexes
CREATE INDEX idx_hospitals_email ON hospitals(email);
CREATE INDEX idx_hospitals_city ON hospitals(city);
CREATE INDEX idx_hospitals_active ON hospitals(active);
CREATE INDEX idx_hospitals_created_at ON hospitals(created_at DESC);

-- Step 4: Disable RLS
ALTER TABLE hospitals DISABLE ROW LEVEL SECURITY;

-- Step 5: Grant permissions
GRANT ALL PRIVILEGES ON hospitals TO anon;
GRANT ALL PRIVILEGES ON hospitals TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 6: Verify table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'hospitals' 
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Hospitals table recreated successfully!';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Table structure:';
  RAISE NOTICE '  - id (uuid, primary key)';
  RAISE NOTICE '  - name, regNo, city, pincode';
  RAISE NOTICE '  - contactPerson, email, phone';
  RAISE NOTICE '  - password, address';
  RAISE NOTICE '  - specialties, beds info';
  RAISE NOTICE '  - emergency_services, active';
  RAISE NOTICE '  - timestamps (createdAt, created_at, updated_at)';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Indexes created';
  RAISE NOTICE '✓ RLS disabled';
  RAISE NOTICE '✓ Permissions granted';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Hospital registration will now work!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Clear Supabase cache';
  RAISE NOTICE '1. Go to Supabase Dashboard';
  RAISE NOTICE '2. Click "Settings" → "API"';
  RAISE NOTICE '3. Click "Restart" button';
  RAISE NOTICE '4. Wait 30 seconds';
  RAISE NOTICE '5. Hard refresh browser (Ctrl+Shift+R)';
  RAISE NOTICE '6. Try registration again';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
