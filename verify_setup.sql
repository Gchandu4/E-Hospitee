-- ══════════════════════════════════════════════════════════════
-- VERIFICATION SCRIPT - Run this AFTER complete_database_setup.sql
-- This will show you if everything is set up correctly
-- ══════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- CHECK 1: Verify all tables exist
-- ────────────────────────────────────────────────────────────────
SELECT 
  '✅ CHECK 1: Tables' as check_name,
  COUNT(*) as found_tables,
  CASE 
    WHEN COUNT(*) = 9 THEN '✅ PASS - All 9 tables exist'
    ELSE '❌ FAIL - Missing tables'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('patients', 'hospitals', 'appointments', 'records', 'medications', 'vitals', 'emergencies', 'audit_logs', 'demo_requests');

-- ────────────────────────────────────────────────────────────────
-- CHECK 2: Verify patientId column exists in patients table
-- ────────────────────────────────────────────────────────────────
SELECT 
  '✅ CHECK 2: patientId Column' as check_name,
  COUNT(*) as found_columns,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASS - patientId column exists'
    ELSE '❌ FAIL - patientId column missing'
  END as status
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name = 'patientId';

-- ────────────────────────────────────────────────────────────────
-- CHECK 3: Verify fileData column exists in records table
-- ────────────────────────────────────────────────────────────────
SELECT 
  '✅ CHECK 3: fileData Column' as check_name,
  COUNT(*) as found_columns,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASS - fileData column exists'
    ELSE '❌ FAIL - fileData column missing'
  END as status
FROM information_schema.columns 
WHERE table_name = 'records' 
AND column_name = 'fileData';

-- ────────────────────────────────────────────────────────────────
-- CHECK 4: Verify demo_requests table exists
-- ────────────────────────────────────────────────────────────────
SELECT 
  '✅ CHECK 4: demo_requests Table' as check_name,
  COUNT(*) as found_tables,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASS - demo_requests table exists'
    ELSE '❌ FAIL - demo_requests table missing'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'demo_requests';

-- ────────────────────────────────────────────────────────────────
-- CHECK 5: Verify RLS is disabled on all tables
-- ────────────────────────────────────────────────────────────────
SELECT 
  '✅ CHECK 5: RLS Disabled' as check_name,
  COUNT(*) as tables_with_rls_disabled,
  CASE 
    WHEN COUNT(*) = 9 THEN '✅ PASS - RLS disabled on all tables'
    ELSE '❌ FAIL - RLS still enabled on some tables'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('patients', 'hospitals', 'appointments', 'records', 'medications', 'vitals', 'emergencies', 'audit_logs', 'demo_requests')
AND rowsecurity = false;

-- ────────────────────────────────────────────────────────────────
-- CHECK 6: Verify indexes exist
-- ────────────────────────────────────────────────────────────────
SELECT 
  '✅ CHECK 6: Indexes' as check_name,
  COUNT(*) as found_indexes,
  CASE 
    WHEN COUNT(*) >= 10 THEN '✅ PASS - Indexes created'
    ELSE '⚠️ WARNING - Some indexes may be missing'
  END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('patients', 'hospitals', 'appointments', 'records', 'medications', 'vitals', 'emergencies', 'demo_requests');

-- ────────────────────────────────────────────────────────────────
-- SUMMARY: Show all table names
-- ────────────────────────────────────────────────────────────────
SELECT 
  '📋 SUMMARY: All Tables' as info,
  table_name,
  CASE 
    WHEN table_name IN ('patients', 'hospitals', 'appointments', 'records', 'medications', 'vitals', 'emergencies', 'audit_logs', 'demo_requests') 
    THEN '✅ Required'
    ELSE '⚠️ Extra'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ────────────────────────────────────────────────────────────────
-- SUMMARY: Show patients table columns
-- ────────────────────────────────────────────────────────────────
SELECT 
  '📋 SUMMARY: Patients Columns' as info,
  column_name,
  data_type,
  CASE 
    WHEN column_name = 'patientId' THEN '✅ NEW - Patient ID column'
    ELSE ''
  END as notes
FROM information_schema.columns 
WHERE table_name = 'patients' 
ORDER BY ordinal_position;

-- ────────────────────────────────────────────────────────────────
-- SUMMARY: Show records table columns
-- ────────────────────────────────────────────────────────────────
SELECT 
  '📋 SUMMARY: Records Columns' as info,
  column_name,
  data_type,
  CASE 
    WHEN column_name = 'fileData' THEN '✅ NEW - File data column'
    ELSE ''
  END as notes
FROM information_schema.columns 
WHERE table_name = 'records' 
ORDER BY ordinal_position;

-- ────────────────────────────────────────────────────────────────
-- FINAL MESSAGE
-- ────────────────────────────────────────────────────────────────
DO $$
DECLARE
  tables_count INT;
  patientid_exists INT;
  filedata_exists INT;
  demo_table_exists INT;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO tables_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('patients', 'hospitals', 'appointments', 'records', 'medications', 'vitals', 'emergencies', 'audit_logs', 'demo_requests');
  
  -- Check patientId column
  SELECT COUNT(*) INTO patientid_exists
  FROM information_schema.columns 
  WHERE table_name = 'patients' AND column_name = 'patientId';
  
  -- Check fileData column
  SELECT COUNT(*) INTO filedata_exists
  FROM information_schema.columns 
  WHERE table_name = 'records' AND column_name = 'fileData';
  
  -- Check demo_requests table
  SELECT COUNT(*) INTO demo_table_exists
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'demo_requests';
  
  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE '                    VERIFICATION RESULTS';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  IF tables_count = 9 AND patientid_exists = 1 AND filedata_exists = 1 AND demo_table_exists = 1 THEN
    RAISE NOTICE '🎉 SUCCESS! Everything is set up correctly!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ All 9 tables exist';
    RAISE NOTICE '✅ patientId column exists in patients table';
    RAISE NOTICE '✅ fileData column exists in records table';
    RAISE NOTICE '✅ demo_requests table exists';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your E-Hospitee database is ready to use!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Hard refresh your browser (Ctrl+Shift+R)';
    RAISE NOTICE '2. Test registration on your website';
    RAISE NOTICE '3. Verify patient ID shows in dashboard';
  ELSE
    RAISE NOTICE '⚠️ SETUP INCOMPLETE - Please run complete_database_setup.sql';
    RAISE NOTICE '';
    IF tables_count < 9 THEN
      RAISE NOTICE '❌ Missing tables (found % of 9)', tables_count;
    END IF;
    IF patientid_exists = 0 THEN
      RAISE NOTICE '❌ patientId column missing from patients table';
    END IF;
    IF filedata_exists = 0 THEN
      RAISE NOTICE '❌ fileData column missing from records table';
    END IF;
    IF demo_table_exists = 0 THEN
      RAISE NOTICE '❌ demo_requests table missing';
    END IF;
    RAISE NOTICE '';
    RAISE NOTICE '📝 Action required:';
    RAISE NOTICE '1. Run complete_database_setup.sql in Supabase SQL Editor';
    RAISE NOTICE '2. Then run this verification script again';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
END $$;
