do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where constraint_name = 'todo_items_linked_entry_owner_fkey'
      and table_schema = 'public'
      and table_name = 'todo_items'
  ) then
    alter table public.todo_items
      drop constraint todo_items_linked_entry_owner_fkey;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_name = 'todo_items_linked_entry_fkey'
      and table_schema = 'public'
      and table_name = 'todo_items'
  ) then
    alter table public.todo_items
      add constraint todo_items_linked_entry_fkey
      foreign key (linked_entry_id)
      references public.entries(id)
      on delete set null;
  end if;
end $$;

create index if not exists todo_items_linked_entry_idx
  on public.todo_items (linked_entry_id)
  where linked_entry_id is not null;
