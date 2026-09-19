begin;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null
    check (char_length(display_name) between 2 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interests (
  id bigint generated always as identity primary key,
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null
    check (char_length(name) between 2 and 60),
  icon_name text not null,
  sort_order smallint not null default 0,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_interests (
  user_id uuid not null references public.profiles (id) on delete cascade,
  interest_id bigint not null references public.interests (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, interest_id)
);

create index user_interests_interest_id_idx
  on public.user_interests (interest_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  inferred_display_name text;
begin
  inferred_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'NearMe user'
  );

  if char_length(inferred_display_name) < 2 then
    inferred_display_name := 'NearMe user';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, left(inferred_display_name, 80));

  return new;
end;
$$;

create trigger auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.interests enable row level security;
alter table public.user_interests enable row level security;

grant select, insert, update on table public.profiles to authenticated;
grant select on table public.interests to authenticated;
grant select, insert, delete on table public.user_interests to authenticated;

create policy "Users can read their profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can create their profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Authenticated users can read enabled interests"
on public.interests
for select
to authenticated
using (is_enabled);

create policy "Users can read their interests"
on public.user_interests
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can add their interests"
on public.user_interests
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can remove their interests"
on public.user_interests
for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.replace_user_interests(
  selected_interest_ids bigint[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'An authenticated user is required.';
  end if;

  if selected_interest_ids is null then
    raise exception 'selected_interest_ids cannot be null.';
  end if;

  if exists (
    select 1
    from unnest(selected_interest_ids) as selected_id
    left join public.interests
      on interests.id = selected_id
      and interests.is_enabled
    where interests.id is null
  ) then
    raise exception 'One or more interests are invalid.';
  end if;

  delete from public.user_interests
  where user_id = current_user_id;

  insert into public.user_interests (user_id, interest_id)
  select current_user_id, selected_id
  from (
    select distinct unnest(selected_interest_ids) as selected_id
  ) as selected_interests;
end;
$$;

revoke all on function public.replace_user_interests(bigint[]) from public;
grant execute on function public.replace_user_interests(bigint[])
  to authenticated;

insert into public.interests (slug, name, icon_name, sort_order)
values
  ('culture', 'Culture', 'account_balance', 10),
  ('food', 'Food', 'local_dining', 20),
  ('museums', 'Museums', 'museum', 30),
  ('nature', 'Nature', 'forest', 40),
  ('nightlife', 'Nightlife', 'nightlife', 50),
  ('parks', 'Parks', 'park', 60),
  ('shopping', 'Shopping', 'shopping_bag', 70),
  ('sports', 'Sports', 'sports', 80),
  ('attractions', 'Attractions', 'attractions', 90)
on conflict (slug) do update
set
  name = excluded.name,
  icon_name = excluded.icon_name,
  sort_order = excluded.sort_order,
  is_enabled = true;

commit;
