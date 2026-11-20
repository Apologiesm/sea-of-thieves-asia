-- A security-definer view must be read-only for clients.
revoke all on public.public_profiles from anon, authenticated;
grant select on public.public_profiles to anon, authenticated;

-- Clients must never write through the public projection.
revoke all on public.public_profiles from public;
