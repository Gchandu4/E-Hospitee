-- ══════════════════════════════════════
-- E-HOSPITEE — Supabase Security Setup
-- Run this in Supabase SQL Editor
-- NOTE: This app uses custom auth (not Supabase Auth)
-- so auth.uid() is always null. Policies use anon role grants instead.
-- ══════════════════════════════════════

-- ── DROP OLD POLICIES IF THEY EXIST ──
drop policy if exists "patients_select_own"  on patients;
drop policy if exists "patients_update_own"  on patients;
drop policy if exists "patients_insert"      on patients;
drop policy if exists "hospitals_select_own" on hospitals;
drop policy if exists "hospitals_update_own" on hospitals;
drop policy if exists "hospitals_insert"     on hospitals;

-- ── 1. AUDIT LOGS TABLE ──
create table if not exists audit_logs (
  id        uuid primary key default gen_random_uuid(),
  level     text not null,
  event     text not null,
  data      text,
  user_id   uuid,
  user_role text,
  url       text,
  timestamp timestamptz default now()
);

-- ── 2. DISABLE RLS ON ALL TABLES (custom auth handles security in JS) ──
alter table patients      disable row level security;
alter table hospitals     disable row level security;
alter table appointments  disable row level security;
alter table records       disable row level security;
alter table medications   disable row level security;
alter table vitals        disable row level security;
alter table emergencies   disable row level security;
alter table audit_logs    disable row level security;

-- ── 3. GRANT ANON ROLE ACCESS TO ALL TABLES ──
grant select, insert, update, delete on patients     to anon;
grant select, insert, update, delete on hospitals    to anon;
grant select, insert, update, delete on appointments to anon;
grant select, insert, update, delete on records      to anon;
grant select, insert, update, delete on medications  to anon;
grant select, insert, update, delete on vitals       to anon;
grant select, insert, update, delete on emergencies  to anon;
grant select, insert               on audit_logs    to anon;

-- ── 4. GRANT USAGE ON SEQUENCES ──
grant usage on all sequences in schema public to anon;
