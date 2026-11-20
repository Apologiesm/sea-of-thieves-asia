begin;
create extension if not exists pgtap;
select plan(4);

select ok(
  (select count(*) = 0 from pg_class
   where relnamespace='public'::regnamespace and relkind='r' and not relrowsecurity),
  'every public table has RLS enabled'
);

select ok(
  (select count(*) = 0 from pg_policy p
   join pg_class c on c.oid=p.polrelid
   where 'anon'::regrole::oid = any(p.polroles)
     and p.polcmd in ('INSERT','UPDATE','DELETE','*')),
  'no policy grants anon write access'
);

select ok(
  (select count(*) = 0 from pg_proc p
   join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(p.proconfig) cfg where cfg like 'search_path=%')),
  'all security definer functions pin search_path'
);

select ok(
  (select count(*) >= 1 from pg_proc p
   join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname in ('log_admin_action','admin_set_role')),
  'audit and role functions exist'
);

select * from finish();
rollback;
