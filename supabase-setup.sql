-- ══════════════════════════════════════
-- E-HOSPITEE — Supabase Security Setup
-- Run this in Supabase → SQL Editor
-- ══════════════════════════════════════

-- ── 1. AUDIT LOGS TABLE ──
-- Stores auth events, API errors, and anomalies from the frontend logger
create table if not exists audit_logs (
  id          uuid primary key default gen_random_uuid(),
  level       text not null,           -- 'info' | 'warn' | 'error'
  event       text not null,           -- e.g. 'login_success', 'ANOMALY:idor_attempt_read'
  data        text,                    -- JSON string, sanitized (no passwords)
  user_id     uuid,
  user_role   text,
  url         text,
  timestamp   timestamptz default now()
);

-- Only the service role can read audit logs (not the anon key)
alter table audit_logs enable row level security;
create policy "audit_logs_insert_only" on audit_logs
  for insert with check (true);        -- frontend can insert
-- No select/update/delete policy = anon users cannot read logs

-- ── 2. ROW LEVEL SECURITY — PATIENTS ──
alter table patients enable row level security;

-- Patients can only read/update their own row
create policy "patients_select_own" on patients
  for select using (auth.uid()::text = id::text);

create policy "patients_update_own" on patients
  for update using (auth.uid()::text = id::text);

-- Anyone can insert (registration)
create policy "patients_insert" on patients
  for insert with check (true);

-- ── 3. ROW LEVEL SECURITY — HOSPITALS ──
alter table hospitals enable row level security;

create policy "hospitals_select_own" on hospitals
  for select using (auth.uid()::text = id::text);

create policy "hospitals_update_own" on hospitals
  for update using (auth.uid()::text = id::text);

create policy "hospitals_insert" on hospitals
  for insert with check (true);

-- ── 4. ROW LEVEL SECURITY — PATIENT-OWNED TABLES ──
-- appointments, records, medications, vitals, emergencies
-- Each patient can only access rows where patientId = their own id

do $$
declare
  t text;
begin
  foreach t in array array['appointments','records','medications','vitals','emergencies']
  loop
    execute format('alter table %I enable row level security', t);

    execute format(
      'create policy "%s_select_own" on %I for select using (auth.uid()::text = "patientId"::text)',
      t, t
    );
    execute format(
      'create policy "%s_insert_own" on %I for insert with check (auth.uid()::text = "patientId"::text)',
      t, t
    );
    execute format(
      'create policy "%s_update_own" on %I for update using (auth.uid()::text = "patientId"::text)',
      t, t
    );
    execute format(
      'create policy "%s_delete_own" on %I for delete using (auth.uid()::text = "patientId"::text)',
      t, t
    );
  end loop;
end $$;

-- ── 5. RESTRICT DIRECT DB ACCESS ──
-- Revoke public schema access from anon role (Supabase default is too permissive)
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

-- Re-grant only what the app needs via RLS policies above
grant select, insert, update on patients to anon;
grant select, insert, update on hospitals to anon;
grant select, insert, update, delete on appointments to anon;
grant select, insert, update, delete on records to anon;
grant select, insert, update, delete on medications to anon;
grant select, insert, update, delete on vitals to anon;
grant select, insert on emergencies to anon;
grant insert on audit_logs to anon;
