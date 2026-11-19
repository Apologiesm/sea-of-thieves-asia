-- Run with: supabase db test
begin;

create extension if not exists pgtap;

select plan(2);

select ok(
  (
    select bool_and(c.relrowsecurity)
    from pg_class c
    where c.relnamespace = 'public'::regnamespace
      and c.relkind = 'r'
      and c.relname in (
        'profiles', 'user_roles', 'events', 'event_rsvps', 'guides',
        'announcements', 'gallery_items', 'crew_listings',
        'crew_applications', 'reports', 'moderation_actions',
        'audit_log', 'user_consents'
      )
  ),
  'row level security is enabled on every application table'
);

select ok(
  (
    select count(*) = 0
    from pg_class c
    where c.relnamespace = 'public'::regnamespace
      and c.relkind = 'r'
      and c.relname in (
        'profiles', 'user_roles', 'events', 'event_rsvps', 'guides',
        'announcements', 'gallery_items', 'crew_listings',
        'crew_applications', 'reports', 'moderation_actions',
        'audit_log', 'user_consents'
      )
      and not c.relrowsecurity
  ),
  'no application table lacks row level security'
);

select * from finish();

rollback;
