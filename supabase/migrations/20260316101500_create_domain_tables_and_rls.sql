create extension if not exists pgcrypto;

create schema if not exists app;

create or replace function app.current_user_id()
returns text
language sql
stable
set search_path = ''
as $$
  select case pg_catalog.current_setting('app.current_user_id', true)
    when '' then null
    else pg_catalog.current_setting('app.current_user_id', true)
  end;
$$;

create or replace function app.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.timezone('utc', pg_catalog.now());
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'entry_type'
  ) then
    create type public.entry_type as enum (
      'fuel',
      'maintenance_expense',
      'maintenance_done'
    );
  end if;

  if not exists (
    select 1 from pg_type where typname = 'expense_category'
  ) then
    create type public.expense_category as enum (
      'fuel',
      'preventive_maintenance',
      'regular_maintenance',
      'improvements',
      'repairs'
    );
  end if;

  if not exists (
    select 1 from pg_type where typname = 'maintenance_item_status'
  ) then
    create type public.maintenance_item_status as enum (
      'upcoming',
      'due_soon',
      'overdue',
      'completed'
    );
  end if;

  if not exists (
    select 1 from pg_type where typname = 'todo_status'
  ) then
    create type public.todo_status as enum (
      'pending',
      'in_progress',
      'completed',
      'cancelled'
    );
  end if;

  if not exists (
    select 1 from pg_type where typname = 'todo_priority'
  ) then
    create type public.todo_priority as enum (
      'low',
      'medium',
      'high',
      'urgent'
    );
  end if;
end $$;

create table if not exists public.cars (
  id text primary key default gen_random_uuid()::text,
  owner_user_id text not null references public."user"(id) on delete cascade,
  name text not null,
  make text not null,
  model text not null,
  year integer not null check (year between 1900 and 2100),
  vin text,
  color text,
  license_plate text,
  current_mileage numeric(10, 1) not null default 0,
  fuel_tank_capacity numeric(5, 1),
  fuel_type text,
  total_fuel_spent numeric(12, 2) not null default 0,
  total_maintenance_spent numeric(12, 2) not null default 0,
  total_improvements_spent numeric(12, 2) not null default 0,
  total_repairs_spent numeric(12, 2) not null default 0,
  image_url text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_user_id, id)
);

create table if not exists public.maintenance_schedule_items (
  id text primary key default gen_random_uuid()::text,
  owner_user_id text not null references public."user"(id) on delete cascade,
  car_id text not null,
  name text not null,
  description text,
  interval_miles numeric(10, 1) not null check (interval_miles > 0),
  interval_months integer check (interval_months is null or interval_months > 0),
  last_done_mileage numeric(10, 1),
  last_done_date date,
  next_due_mileage numeric(10, 1),
  next_due_date date,
  status public.maintenance_item_status not null default 'upcoming',
  estimated_cost numeric(10, 2),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_user_id, id),
  constraint maintenance_schedule_items_car_owner_fkey
    foreign key (car_id, owner_user_id)
    references public.cars(id, owner_user_id)
    on delete cascade
);

create table if not exists public.todo_items (
  id text primary key default gen_random_uuid()::text,
  owner_user_id text not null references public."user"(id) on delete cascade,
  car_id text not null,
  title text not null,
  description text,
  priority public.todo_priority not null default 'medium',
  status public.todo_status not null default 'pending',
  category public.expense_category,
  estimated_cost numeric(10, 2),
  linked_entry_id text,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_user_id, id),
  constraint todo_items_car_owner_fkey
    foreign key (car_id, owner_user_id)
    references public.cars(id, owner_user_id)
    on delete cascade
);

create table if not exists public.entries (
  id text primary key default gen_random_uuid()::text,
  owner_user_id text not null references public."user"(id) on delete cascade,
  car_id text not null,
  entry_type public.entry_type not null,
  date date not null,
  mileage numeric(10, 1) not null check (mileage >= 0),
  fuel_gallons numeric(7, 3),
  fuel_price_per_gallon numeric(6, 3),
  fuel_total_cost numeric(10, 2),
  fuel_station text,
  fuel_octane text,
  was_full_tank boolean,
  expense_category public.expense_category,
  expense_amount numeric(12, 2),
  description text,
  vendor text,
  parts_replaced text,
  maintenance_item_id text,
  todo_id text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_user_id, id),
  constraint entries_car_owner_fkey
    foreign key (car_id, owner_user_id)
    references public.cars(id, owner_user_id)
    on delete cascade,
  constraint entries_maintenance_owner_fkey
    foreign key (maintenance_item_id, owner_user_id)
    references public.maintenance_schedule_items(id, owner_user_id)
    on delete set null,
  constraint entries_todo_owner_fkey
    foreign key (todo_id, owner_user_id)
    references public.todo_items(id, owner_user_id)
    on delete set null
);

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_name = 'todo_items_linked_entry_owner_fkey'
      and table_schema = 'public'
      and table_name = 'todo_items'
  ) then
    alter table public.todo_items
      add constraint todo_items_linked_entry_owner_fkey
      foreign key (linked_entry_id, owner_user_id)
      references public.entries(id, owner_user_id)
      on delete set null;
  end if;
end $$;

create index if not exists cars_owner_updated_idx
  on public.cars (owner_user_id, updated_at desc);

create index if not exists entries_owner_car_date_idx
  on public.entries (owner_user_id, car_id, date desc);

create index if not exists entries_owner_created_idx
  on public.entries (owner_user_id, created_at desc);

create index if not exists maintenance_owner_car_status_idx
  on public.maintenance_schedule_items (owner_user_id, car_id, status);

create index if not exists maintenance_owner_due_idx
  on public.maintenance_schedule_items (owner_user_id, next_due_date, next_due_mileage);

create index if not exists todo_owner_car_status_priority_idx
  on public.todo_items (owner_user_id, car_id, status, priority);

create trigger cars_touch_updated_at
before update on public.cars
for each row
execute function app.touch_updated_at();

create trigger maintenance_schedule_items_touch_updated_at
before update on public.maintenance_schedule_items
for each row
execute function app.touch_updated_at();

create trigger todo_items_touch_updated_at
before update on public.todo_items
for each row
execute function app.touch_updated_at();

create trigger entries_touch_updated_at
before update on public.entries
for each row
execute function app.touch_updated_at();

alter table public.user_profiles enable row level security;
alter table public.cars enable row level security;
alter table public.entries enable row level security;
alter table public.maintenance_schedule_items enable row level security;
alter table public.todo_items enable row level security;

drop policy if exists user_profiles_owner_policy on public.user_profiles;
create policy user_profiles_owner_policy
on public.user_profiles
for all
using (user_id = app.current_user_id())
with check (user_id = app.current_user_id());

drop policy if exists cars_owner_policy on public.cars;
create policy cars_owner_policy
on public.cars
for all
using (owner_user_id = app.current_user_id())
with check (owner_user_id = app.current_user_id());

drop policy if exists entries_owner_policy on public.entries;
create policy entries_owner_policy
on public.entries
for all
using (owner_user_id = app.current_user_id())
with check (owner_user_id = app.current_user_id());

drop policy if exists maintenance_schedule_items_owner_policy on public.maintenance_schedule_items;
create policy maintenance_schedule_items_owner_policy
on public.maintenance_schedule_items
for all
using (owner_user_id = app.current_user_id())
with check (owner_user_id = app.current_user_id());

drop policy if exists todo_items_owner_policy on public.todo_items;
create policy todo_items_owner_policy
on public.todo_items
for all
using (owner_user_id = app.current_user_id())
with check (owner_user_id = app.current_user_id());
