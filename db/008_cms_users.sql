-- The people who may log in to the cms, see apps/cms/src/lib/auth.ts. Login
-- is with Google through Supabase Auth, and only these email addresses are
-- let in. Added by hand, e.g.:
--
--   insert into public.cms_users (email) values ('someone@example.com');
create table if not exists public.cms_users (
  -- Stored in lower case, since that's how it's looked up.
  email text primary key,
  created_at timestamptz not null default now(),

  constraint cms_users_email_lower_case check (email = lower(email))
);

-- RLS on without policies: only the cms (service role) and the hook below
-- may read it.
alter table public.cms_users enable row level security;

-- Supabase Auth's "Before User Created" hook. Stops anyone else from getting
-- an account in auth.users when they log in with Google. The cms checks the
-- table on every request too, so removing an address locks it out even
-- though its account remains.
--
-- Enabled in the Supabase dashboard: Authentication > Auth Hooks > Before
-- User Created > Postgres function public.cms_before_user_created.
create or replace function public.cms_before_user_created(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.cms_users
    where email = lower(event -> 'user' ->> 'email')
  ) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error',
    jsonb_build_object(
      'http_code', 403,
      'message', 'Den här e-postadressen får inte logga in.'
    )
  );
end;
$$;

-- Only Supabase Auth may run the hook.
revoke execute on function public.cms_before_user_created(jsonb)
  from public, anon, authenticated;
grant execute on function public.cms_before_user_created(jsonb)
  to supabase_auth_admin;

-- The login's routes are siblings of the sites' routes too, see
-- db/005_sites.sql.
alter table public.sites
  drop constraint if exists sites_id_format;
alter table public.sites
  add constraint sites_id_format
    check (
      id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      and id not in ('sites', 'login', 'auth')
    );
