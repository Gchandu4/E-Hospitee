# Supabase Setup Guide - Step by Step

## 🎯 Quick Setup (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `ajscgpuozcyqsteseppp`
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"

### Step 2: Create Tables (if not already done)

Copy and paste this entire block into the SQL Editor and click "Run":

```sql
-- Create patients table
create table if not exists patients (
  id            uuid primary key default gen_random_uuid(),
  "firstName"   text,
  "lastName"    text,
  email         text unique,
  mobile        text,
  dob           text,
  "bloodGroup"  text,
  allergies     text,
  "emergencyContact" text,
  password      text,
  "createdAt"   text
);

-- Create hospitals table
create table if not exists hospitals (
  id              uuid primary key default gen_random_uuid(),
  name            text,
  "regNo"         text,
  email           text unique,
  city            text,
  pincode         text,
  "contactPerson" text,
  phone           text,
  password        text,
  "createdAt"     text
);

-- Create appointments table
create table if not exists appointments (
  id          uuid primary key default gen_random_uuid(),
  "patientId" uuid,
  doctor      text,
  specialty   text,
  hospital    text,
  date        text,
  time        text,
  status      text,
  fee         int,
  "createdAt" text
);

-- Create records table
create table if not exists records (
  id          uuid primary key default gen_random_uuid(),
  "patientId" uuid,
  name        text,
  type        text,
  hospital    text,
  date        text,
  "fileData"  text,
  "createdAt" text
);

-- Create medications table
create table if not exists medications (
  id             uuid primary key default gen_random_uuid(),
  "patientId"    uuid,
  name           text,
  dose           text,
  frequency      text,
  time           text,
  "prescribedBy" text,
  active         boolean,
  "createdAt"    text
);

-- Create vitals table
create table if not exists vitals (
  id           uuid primary key default gen_random_uuid(),
  "patientId"  uuid,
  "heartRate"  text,
  bp           text,
  temp         text,
  sugar        text,
  weight       text,
  spo2         text,
  "recordedAt" text
);

-- Create emergencies table
create table if not exists emergencies (
  id            uuid primary key default gen_random_uuid(),
  "patientId"   uuid,
  type          text,
  location      text,
  status        text,
  "triggeredAt" text
);

-- Create audit_logs table
create table if not exists audit_logs (
  id        uuid primary key default gen_random_uuid(),
  level     text,
  event     text,
  data      text,
  user_id   uuid,
  user_role text,
  url       text,
  timestamp timestamptz default now()
);
```

**Expected Result**: "Success. No rows returned"

### Step 3: Disable RLS (Row Level Security)

Copy and paste this block and click "Run":

```sql
-- Disable RLS on all tables
alter table patients      disable row level security;
alter table hospitals     disable row level security;
alter table appointments  disable row level security;
alter table records       disable row level security;
alter table medications   disable row level security;
alter table vitals        disable row level security;
alter table emergencies   disable row level security;
alter table audit_logs    disable row level security;
```

**Expected Result**: "Success. No rows returned"

### Step 4: Grant Permissions

Copy and paste this block and click "Run":

```sql
-- Grant full access to anon role
grant all privileges on all tables    in schema public to anon;
grant all privileges on all sequences in schema public to anon;
grant usage on schema public to anon;
```

**Expected Result**: "Success. No rows returned"

### Step 5: Verify Setup

Copy and paste this query to verify everything is set up correctly:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name IN ('patients', 'hospitals', 'appointments', 'records', 'medications', 'vitals', 'emergencies', 'audit_logs')
ORDER BY table_name;
```

**Expected Result**: Should show 8 table names:
- appointments
- audit_logs
- emergencies
- hospitals
- medications
- patients
- records
- vitals

## ✅ Verification Checklist

After running all steps, verify:

- [ ] 8 tables created
- [ ] RLS disabled on all tables
- [ ] Anon role has permissions
- [ ] No errors in SQL Editor

## 🔍 Troubleshooting

### Error: "relation already exists"
**Solution**: Tables already created, skip to Step 3

### Error: "permission denied"
**Solution**: Make sure you're the project owner

### Error: "syntax error"
**Solution**: Make sure you copied the entire SQL block

## 🎉 Success!

If all steps completed without errors, your Supabase database is ready!

Next steps:
1. Test locally: Run `test_local.bat`
2. Deploy to Render
3. Test registration and login

## 📞 Need Help?

If you see any errors:
1. Copy the exact error message
2. Check which step failed
3. Verify you copied the complete SQL block
4. Make sure you're in the correct Supabase project
