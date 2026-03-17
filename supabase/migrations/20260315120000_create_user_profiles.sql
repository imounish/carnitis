create table if not exists public.user_profiles (
  user_id text primary key references public."user"(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists user_profiles_onboarding_completed_idx
  on public.user_profiles (onboarding_completed);
