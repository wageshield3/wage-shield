-- Helper mode. Run once in Supabase SQL Editor.
alter table profiles add column if not exists link_code text unique
  default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
update profiles set link_code = upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6))
  where link_code is null;

-- Only the server (after checking the worker's code) may create helper links.
drop policy if exists hl_add on helper_links;
