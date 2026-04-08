-- ══════════════════════════════════════
-- FIX RECORDS TABLE - ADD MISSING COLUMNS
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════

-- Add fileData column if it doesn't exist
ALTER TABLE records ADD COLUMN IF NOT EXISTS "fileData" text;

-- Verify column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'records' 
ORDER BY ordinal_position;

-- Expected columns:
-- id, patientId, name, type, hospital, date, fileData, createdAt
