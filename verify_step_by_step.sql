-- ══════════════════════════════════════
-- E-HOSPITEE SUPABASE VERIFICATION
-- Copy and paste EACH query separately into Supabase SQL Editor
-- ══════════════════════════════════════

-- ────────────────────────────────────────
-- STEP 1: Check if tables exist
-- Copy from here ↓
-- ────────────────────────────────────────

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name IN ('patients', 'hospitals', 'appointments', 'records', 'medications', 'vitals', 'emergencies', 'audit_logs')
ORDER BY table_name;

-- Expected: Should show 8 table names
-- If you see less than 8, run supabase-setup.sql first


-- ────────────────────────────────────────
-- STEP 2: Check RLS status (should be FALSE)
-- Copy from here ↓
-- ────────────────────────────────────────

SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('patients', 'hospitals', 'appointments', 'records', 'medications', 'vitals', 'emergencies', 'audit_logs')
ORDER BY tablename;

-- Expected: All rls_enabled should be FALSE (f)
-- If TRUE, RLS is enabled (not good for this app)


-- ────────────────────────────────────────
-- STEP 3: Count records
-- Copy from here ↓
-- ────────────────────────────────────────

SELECT 'patients' as table_name, COUNT(*) as records FROM patients
UNION ALL
SELECT 'hospitals', COUNT(*) FROM hospitals
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'records', COUNT(*) FROM records
UNION ALL
SELECT 'medications', COUNT(*) FROM medications
UNION ALL
SELECT 'vitals', COUNT(*) FROM vitals
UNION ALL
SELECT 'emergencies', COUNT(*) FROM emergencies
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs;

-- Expected: Shows count for each table (may be 0 for new setup)


-- ────────────────────────────────────────
-- STEP 4: Check if any users exist
-- Copy from here ↓
-- ────────────────────────────────────────

SELECT email, "firstName", "lastName", "createdAt" 
FROM patients 
ORDER BY "createdAt" DESC 
LIMIT 5;

-- Expected: Shows registered patients (empty if none registered yet)


-- ────────────────────────────────────────
-- STEP 5: Check hospitals
-- Copy from here ↓
-- ────────────────────────────────────────

SELECT name, email, city, "createdAt" 
FROM hospitals 
ORDER BY "createdAt" DESC 
LIMIT 5;

-- Expected: Shows registered hospitals (empty if none registered yet)
