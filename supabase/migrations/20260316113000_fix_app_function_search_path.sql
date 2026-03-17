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
