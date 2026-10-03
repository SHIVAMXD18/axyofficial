create table public.updates (
  id bigint generated always as identity primary key,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.updates enable row level security;
alter table public.site_admins enable row level security;

create policy "Anyone can read updates"
on public.updates
for select
to anon, authenticated
using (true);

create policy "Admins can publish updates"
on public.updates
for insert
to authenticated
with check (
  exists (
    select 1
    from public.site_admins
    where site_admins.user_id = auth.uid()
  )
);

create policy "Admins can delete updates"
on public.updates
for delete
to authenticated
using (
  exists (
    select 1
    from public.site_admins
    where site_admins.user_id = auth.uid()
  )
);

create policy "Admins can read their admin record"
on public.site_admins
for select
to authenticated
using (user_id = auth.uid());
