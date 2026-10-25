-- Wage Shield: Module 1 schema. Run once in the Supabase SQL editor.
create extension if not exists pgcrypto;

create type user_role as enum ('worker','helper','ngo');
create type case_status as enum ('draft','submitted','evidence_review','notice_sent','hearing_scheduled','resolved');
create type evidence_level as enum ('weak','medium','strong');
create type log_source as enum ('tap','voice','photo');

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'worker',
  full_name text,
  language text not null default 'en' check (language in ('en','kn','hi')),
  phone text,
  org_id uuid references organizations(id),
  created_at timestamptz not null default now()
);

create table helper_links (
  helper_id uuid not null references profiles(id) on delete cascade,
  worker_id uuid not null references profiles(id) on delete cascade,
  primary key (helper_id, worker_id)
);

create table work_logs (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references profiles(id),
  logged_by uuid not null references profiles(id),
  work_date date not null,
  hours numeric(4,1) check (hours >= 0 and hours <= 24),
  site_name text,
  contractor_name text,
  promised_wage numeric(10,2) not null default 0 check (promised_wage >= 0),
  paid_amount numeric(10,2) not null default 0 check (paid_amount >= 0),
  balance numeric(10,2) generated always as (promised_wage - paid_amount) stored, -- arithmetic done by DB, never by AI
  source log_source not null,
  audio_url text,
  transcript text,
  confidence numeric(3,2),
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on work_logs (worker_id, work_date);

create table evidence_files (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references work_logs(id) on delete cascade,
  type text not null check (type in ('audio','photo')),
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table coworker_confirmations (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references work_logs(id) on delete cascade,
  confirmer_name text not null,
  confirmed_at timestamptz not null default now()
);

create sequence case_ref_seq;
create function next_reference_no() returns text language sql as $$
  select 'WS-' || extract(year from now())::int || '-' || lpad(nextval('case_ref_seq')::text, 4, '0')
$$;

create table cases (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references profiles(id),
  partner_org_id uuid references organizations(id),
  reference_no text unique,               -- assigned at submission via next_reference_no()
  status case_status not null default 'draft',
  total_promised numeric(12,2) not null default 0,
  total_paid numeric(12,2) not null default 0,
  total_unpaid numeric(12,2) not null default 0,
  evidence_strength evidence_level,
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);
create index on cases (partner_org_id, status);

create table case_events (               -- audit trail
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  actor_id uuid references profiles(id),
  actor_role user_role,
  event_type text not null,
  note text,
  created_at timestamptz not null default now()
);
create index on case_events (case_id, created_at);

create table consents (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references profiles(id),
  partner_org_id uuid not null references organizations(id),
  scope_text text not null,
  agreed_at timestamptz not null default now()
);

-- Helper functions (security definer avoids RLS recursion)
create function app_role() returns user_role language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;
create function app_org() returns uuid language sql stable security definer set search_path = public as
$$ select org_id from profiles where id = auth.uid() $$;
create function can_act_for(w uuid) returns boolean language sql stable security definer set search_path = public as
$$ select w = auth.uid() or exists (select 1 from helper_links where helper_id = auth.uid() and worker_id = w) $$;
create function ngo_can_see_worker(w uuid) returns boolean language sql stable security definer set search_path = public as
$$ select app_role() = 'ngo' and exists (select 1 from cases c where c.worker_id = w and c.partner_org_id = app_org() and c.status <> 'draft') $$;
create function can_see_case(cid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from cases c where c.id = cid and (can_act_for(c.worker_id)
     or (app_role() = 'ngo' and c.partner_org_id = app_org() and c.status <> 'draft'))) $$;
create function can_see_log(lid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from work_logs l where l.id = lid and (can_act_for(l.worker_id) or ngo_can_see_worker(l.worker_id))) $$;

-- New auth user -> profile. Only 'worker' or 'helper' can self-select; ngo accounts are created by admin/seed.
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, role, full_name)
  values (new.id,
          case when new.raw_user_meta_data->>'role' = 'helper' then 'helper'::user_role else 'worker'::user_role end,
          new.raw_user_meta_data->>'full_name');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Row Level Security
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table helper_links enable row level security;
alter table work_logs enable row level security;
alter table evidence_files enable row level security;
alter table coworker_confirmations enable row level security;
alter table cases enable row level security;
alter table case_events enable row level security;
alter table consents enable row level security;

create policy org_read on organizations for select to authenticated using (true);

create policy profile_self on profiles for select using (id = auth.uid());
create policy profile_helper on profiles for select using (can_act_for(id));
create policy profile_ngo on profiles for select using (ngo_can_see_worker(id));
create policy profile_update on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = app_role() and org_id is not distinct from app_org());

create policy hl_read on helper_links for select using (helper_id = auth.uid() or worker_id = auth.uid());
create policy hl_add on helper_links for insert with check (helper_id = auth.uid());

-- No DELETE policies on logs or evidence: evidence must not disappear.
create policy log_read on work_logs for select using (can_act_for(worker_id) or ngo_can_see_worker(worker_id));
create policy log_add on work_logs for insert with check (can_act_for(worker_id) and logged_by = auth.uid());
create policy log_edit on work_logs for update using (can_act_for(worker_id)) with check (can_act_for(worker_id));

create policy ev_read on evidence_files for select using (can_see_log(log_id));
create policy ev_add on evidence_files for insert with check (can_see_log(log_id) and app_role() <> 'ngo');
create policy cw_read on coworker_confirmations for select using (can_see_log(log_id));
create policy cw_add on coworker_confirmations for insert with check (can_see_log(log_id) and app_role() <> 'ngo');

create policy case_read on cases for select using (can_see_case(id));
create policy case_add on cases for insert with check (can_act_for(worker_id) and status = 'draft');
create policy case_worker_draft on cases for update using (can_act_for(worker_id) and status = 'draft')
  with check (can_act_for(worker_id) and status in ('draft','submitted'));
-- NGO status updates: do these via an API route that only touches `status` (column-level control).
create policy case_ngo_update on cases for update
  using (app_role() = 'ngo' and partner_org_id = app_org() and status <> 'draft')
  with check (partner_org_id = app_org() and status <> 'draft');

create policy evt_read on case_events for select using (can_see_case(case_id));
create policy evt_add on case_events for insert with check (actor_id = auth.uid() and can_see_case(case_id));

-- Consent is given by the worker personally (not by a helper).
create policy consent_read on consents for select using (worker_id = auth.uid() or (app_role() = 'ngo' and partner_org_id = app_org()));
create policy consent_add on consents for insert with check (worker_id = auth.uid());

-- Realtime for the live NGO dashboard and worker status screen
alter publication supabase_realtime add table cases, case_events;

-- Private storage buckets. Path convention: <worker_id>/<filename>
insert into storage.buckets (id, name, public) values ('audio','audio',false), ('photos','photos',false)
  on conflict (id) do nothing;
create policy st_read on storage.objects for select to authenticated
  using (bucket_id in ('audio','photos') and (can_act_for(((storage.foldername(name))[1])::uuid) or ngo_can_see_worker(((storage.foldername(name))[1])::uuid)));
create policy st_add on storage.objects for insert to authenticated
  with check (bucket_id in ('audio','photos') and can_act_for(((storage.foldername(name))[1])::uuid));

-- Demo partner (simulated; not a real NGO)
insert into organizations (id, name, is_demo)
values ('00000000-0000-0000-0000-0000000000d1', 'Demo Legal Aid Partner', true)
on conflict (id) do nothing;
