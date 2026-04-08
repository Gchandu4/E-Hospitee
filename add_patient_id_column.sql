-- ══════════════════════════════════════
-- ADD PATIENT ID COLUMN
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════

-- Add patientId column to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS "patientId" text UNIQUE;

-- Create a sequence for patient numbers (starts at 1)
CREATE SEQUENCE IF NOT EXISTS patient_number_seq START 1;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients("patientId");

-- Verify column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name = 'patientId';
