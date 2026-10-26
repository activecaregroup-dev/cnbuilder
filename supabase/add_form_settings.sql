-- Adds the builder's form settings (Replan, Confirmation, Tab) to the forms table.
-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to run more than once.

alter table public.forms
  add column if not exists replannable boolean not null default false,
  add column if not exists confirmable boolean not null default false,
  add column if not exists tab_name text not null default '';

-- Make the new columns visible to the API immediately
notify pgrst, 'reload schema';
