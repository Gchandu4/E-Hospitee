-- ══════════════════════════════════════
-- E-HOSPITEE — Supabase Setup
-- Run this ENTIRE script in Supabase SQL Editor
-- ══════════════════════════════════════

-- 1. Create tables if they don't exist
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
  id            uuid primary key default gen_random_uuid(),
  "patientId"   uuid,
  name          text,
  dose          text,
  frequency     text,
  time          text,
  "prescribedBy" text,
  active        boolean,
  "createdAt"   text
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
  id           uuid primary key default gen_random_uuid(),
  "patientId"  uuid,
  type         text,
  location     text,
  status       text,
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

-- 2. Disable RLS on all tables (app uses custom auth)
alter table patients     disable row level security;
alter table hospitals    disable row level security;
alter table appointments disable row level security;
alter table records      disable row level security;
alter table medications  disable row level security;
alter table vitals       disable row level security;
alter table emergencies  disable row level security;
alter table audit_logs   disable row level security;

-- 3. Grant full access to anon role
grant all on all tables    in schema public to anon;
grant all on all sequences in schema public to anon;
