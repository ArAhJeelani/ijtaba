create table public.organizers (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  revision integer not null default 1 check (revision > 0),
  mutation_id uuid not null,
  payload jsonb not null check (
    jsonb_typeof(payload) = 'object'
    and payload @> '{"version": 2}'::jsonb
    and octet_length(payload::text) <= 10485760
  ),
  updated_at timestamptz not null default now()
);

alter table public.organizers enable row level security;
revoke all on public.organizers from public, anon, authenticated;
grant select, delete on public.organizers to authenticated;
grant insert (owner_id, mutation_id, payload) on public.organizers to authenticated;
grant update (revision, mutation_id, payload) on public.organizers to authenticated;

create policy "read own organizer" on public.organizers for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "create own organizer" on public.organizers for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "update own organizer" on public.organizers for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "delete own organizer" on public.organizers for delete to authenticated
  using ((select auth.uid()) = owner_id);

create function public.set_organizer_update_time() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.revision <> old.revision + 1 then
    raise exception 'Invalid organizer revision';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger organizer_update before update on public.organizers
for each row execute function public.set_organizer_update_time();
