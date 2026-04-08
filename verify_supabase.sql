-- ══════════════════════════════════════
-- E-HOSPITEE SUPABASE VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to verify setup
-- ══════════════════════════════════════

-- 1. Check if all tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('patients', 'hospitals', 'appointments', 'records', 'medications', 'vitals', 'emergencies', 'audit_logs')
ORDER BY table_name;

-- 2. Check RLS status (should all be disabled)
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('patients', 'hospitals', 'appointments', 'records', 'medications', 'vitals', 'emergencies', 'audit_logs')
ORDER BY tablename;

-- 3. Check anon role permissions
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'anon'
AND table_schema = 'public'
AND table_name IN ('patients', 'hospitals', 'appointments', 'records', 'medications', 'vitals', 'emergencies', 'audit_logs')
ORDER BY table_name, privilege_type;

-- 4. Count records in each table
SELECT 'patients' as table_name, COUNT(*) as record_count FROM patients
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
SELECT 'audit_logs', COUNT(*) FROM audit_logs
ORDER BY table_name;

-- 5. Check for any patients or hospitals (for testing)
SELECT 'Patients' as type, email, "createdAt" FROM patients LIMIT 5
UNION ALL
SELECT 'Hospitals', email, "createdAt" FROM hospitals LIMIT 5;

-- Expected Results:
-- Query 1: Should show 8 tables with their column counts
-- Query 2: All rls_enabled should be FALSE
-- Query 3: Should show SELECT, INSERT, UPDATE, DELETE for anon role on all tables
-- Query 4: Shows record counts (may be 0 for new setup)
-- Query 5: Shows sample users if any exist
