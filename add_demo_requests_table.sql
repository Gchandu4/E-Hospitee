-- ══════════════════════════════════════
-- ADD DEMO REQUESTS TABLE
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════

-- Create demo_requests table
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

-- Disable RLS
alter table demo_requests disable row level security;

-- Grant permissions to anon role
grant all privileges on table demo_requests to anon;

-- Create index for faster queries
create index if not exists idx_demo_requests_status on demo_requests(status);
create index if not exists idx_demo_requests_requested_at on demo_requests(requested_at desc);

-- Verify table was created
select 
  table_name,
  (select count(*) from information_schema.columns where table_name = 'demo_requests') as column_count
from information_schema.tables
where table_schema = 'public' 
and table_name = 'demo_requests';
