-- ═══════════════════════════════════════════════════════════════
-- E-Hospitee - Add Payment Columns to Database
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- STEP 1: Add payment columns to appointments table
-- ────────────────────────────────────────────────────────────────

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS fee integer DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_id text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_date timestamptz;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS receipt_url text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS invoice_number text;

-- ────────────────────────────────────────────────────────────────
-- STEP 2: Create payments table for detailed tracking
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) ON DELETE CASCADE,
  patient_id uuid references patients(id) ON DELETE CASCADE,
  razorpay_payment_id text,
  razorpay_order_id text,
  razorpay_signature text,
  amount integer not null,
  currency text default 'INR',
  status text default 'pending',
  method text,
  email text,
  contact text,
  description text,
  receipt_url text,
  invoice_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────
-- STEP 3: Create indexes for better performance
-- ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_id ON appointments(payment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_invoice_number ON appointments(invoice_number);

CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at desc);

-- ────────────────────────────────────────────────────────────────
-- STEP 4: Disable RLS on payments table
-- ────────────────────────────────────────────────────────────────

ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────
-- STEP 5: Grant permissions to anon role
-- ────────────────────────────────────────────────────────────────

GRANT ALL PRIVILEGES ON payments TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ────────────────────────────────────────────────────────────────
-- STEP 6: Verify setup
-- ────────────────────────────────────────────────────────────────

-- Check appointments table has payment columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name IN ('fee', 'payment_status', 'payment_id', 'payment_method', 'payment_date', 'invoice_number')
ORDER BY column_name;

-- Check payments table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'payments';

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('appointments', 'payments')
AND indexname LIKE '%payment%'
ORDER BY indexname;

-- ────────────────────────────────────────────────────────────────
-- SUCCESS MESSAGE
-- ────────────────────────────────────────────────────────────────

DO $$
BEGIN
  RAISE NOTICE '✅ Payment columns added to appointments table';
  RAISE NOTICE '✅ Payments table created';
  RAISE NOTICE '✅ Indexes created';
  RAISE NOTICE '✅ RLS disabled on payments table';
  RAISE NOTICE '✅ Permissions granted';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Payment integration database setup complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '1. Add Razorpay script to index.html';
  RAISE NOTICE '2. Include payment-integration.js';
  RAISE NOTICE '3. Update bookAppointment buttons to use bookAppointmentWithPayment';
  RAISE NOTICE '4. Get Razorpay API keys from dashboard.razorpay.com';
END $$;
