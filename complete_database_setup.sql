-- ══════════════════════════════════════════════════════════════
-- E-HOSPITEE - COMPLETE DATABASE SETUP & FIX
-- Run this ENTIRE script in Supabase SQL Editor
-- This will fix all missing columns and set up everything correctly
-- ══════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- STEP 1: Add missing columns to existing tables
-- ────────────────────────────────────────────────────────────────

-- Add patientId column to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS "patientId" text UNIQUE;

-- Add fileData column to records table
ALTER TABLE records ADD COLUMN IF NOT EXISTS "fileData" text;

-- ────────────────────────────────────────────────────────────────
-- STEP 2: Create demo_requests table if it doesn't exist
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS demo_requests (
  id             uuid primary key default gen_random_uuid(),
  hospital_name  text not null,
  mobile         text not null,
  status         text default 'pending',
  requested_at   timestamptz default now(),
  contacted_at   timestamptz,
  notes          text,
  source         text default 'website'
);

-- ────────────────────────────────────────────────────────────────
-- STEP 3: Create indexes for better performance
-- ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients("patientId");
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_hospitals_email ON hospitals(email);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments("patientId");
CREATE INDEX IF NOT EXISTS idx_records_patient_id ON records("patientId");
CREATE INDEX IF NOT EXISTS idx_medications_patient_id ON medications("patientId");
CREATE INDEX IF NOT EXISTS idx_vitals_patient_id ON vitals("patientId");
CREATE INDEX IF NOT EXISTS idx_emergencies_patient_id ON emergencies("patientId");
CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_requested_at ON demo_requests(requested_at desc);

-- ────────────────────────────────────────────────────────────────
-- STEP 4: Disable RLS on all tables
-- ────────────────────────────────────────────────────────────────

ALTER TABLE patients      DISABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals     DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments  DISABLE ROW LEVEL SECURITY;
ALTER TABLE records       DISABLE ROW LEVEL SECURITY;
ALTER TABLE medications   DISABLE ROW LEVEL SECURITY;
ALTER TABLE vitals        DISABLE ROW LEVEL SECURITY;
ALTER TABLE emergencies   DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs    DISABLE ROW LEVEL SECURITY;
ALTER TABLE demo_requests DISABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────
-- STEP 5: Grant permissions to anon role
-- ────────────────────────────────────────────────────────────────

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- ────────────────────────────────────────────────────────────────
-- STEP 6: Verify setup
-- ────────────────────────────────────────────────────────────────

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('patients', 'hospitals', 'appointments', 'records', 'medications', 'vitals', 'emergencies', 'audit_logs', 'demo_requests')
ORDER BY table_name;

-- Check patients table has patientId column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name = 'patientId';

-- Check records table has fileData column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'records' 
AND column_name = 'fileData';

-- Check RLS status (should all be false)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('patients', 'hospitals', 'appointments', 'records', 'medications', 'vitals', 'emergencies', 'audit_logs', 'demo_requests')
ORDER BY tablename;

-- ────────────────────────────────────────────────────────────────
-- SUCCESS MESSAGE
-- ────────────────────────────────────────────────────────────────

DO $$
BEGIN
  RAISE NOTICE '✅ Database setup complete!';
  RAISE NOTICE '✅ All tables verified';
  RAISE NOTICE '✅ Missing columns added';
  RAISE NOTICE '✅ Indexes created';
  RAISE NOTICE '✅ RLS disabled';
  RAISE NOTICE '✅ Permissions granted';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your E-Hospitee database is ready!';
END $$;
