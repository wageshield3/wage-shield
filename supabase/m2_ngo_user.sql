-- Run AFTER creating the user ngo@wageshield.test in Supabase Authentication.
update profiles
set role = 'ngo',
    org_id = '00000000-0000-0000-0000-0000000000d1',
    full_name = 'Demo Legal Aid Partner'
where id = (select id from auth.users where email = 'ngo@wageshield.test');
