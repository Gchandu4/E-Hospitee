-- ══════════════════════════════════════
-- E-HOSPITEE — Run this in Supabase SQL Editor
-- ══════════════════════════════════════

-- Step 1: Create tables
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

create table if not exists emergencies (
  id            uuid primary key default gen_random_uuid(),
  "patientId"   uuid,
  type          text,
  location      text,
  status        text,
  "triggeredAt" text
);

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

create table if not exists demo_requests (
  id             uuid primary key default gen_random_uuid(),
  hospital_name  text not null,
  mobile         text not null,
  status         text default 'pending',
  requested_at   timestamptz default now(),
  contacted_at   timestamptz,
  notes          text,
  source         text default 'website'
);

-- Step 2: Disable RLS on ALL tables
alter table patients      disable row level security;
alter table hospitals     disable row level security;
alter table appointments  disable row level security;
alter table records       disable row level security;
alter table medications   disable row level security;
alter table vitals        disable row level security;
alter table emergencies   disable row level security;
alter table audit_logs    disable row level security;
alter table demo_requests disable row level security;

-- Step 3: Grant full access to anon role
grant all privileges on all tables    in schema public to anon;
grant all privileges on all sequences in schema public to anon;
grant usage on schema public to anon;
