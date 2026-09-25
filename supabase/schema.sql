-- Jessika & Joshua wedding — run this in the Supabase SQL editor.
-- Dashboard: Project → SQL → New query → paste → Run.

create extension if not exists pgcrypto;

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text not null default 'Guest',
  tier text not null default 'both' check (tier in ('both', 'brunch', 'night')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references public.guests(id) on delete set null,
  guest_phone text not null,
  guest_names text not null default '',
  brunch_attending text,
  brunch_kids text default '0',
  bar_attending text,
  dietary text default 'None',
  jukebox_track text default '',
  jukebox_artist text default '',
  spotify_url text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guest_phone)
);

create index if not exists guests_phone_idx on public.guests (phone);
create index if not exists rsvps_guest_id_idx on public.rsvps (guest_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists guests_touch_updated_at on public.guests;
create trigger guests_touch_updated_at
before update on public.guests
for each row execute procedure public.touch_updated_at();

drop trigger if exists rsvps_touch_updated_at on public.rsvps;
create trigger rsvps_touch_updated_at
before update on public.rsvps
for each row execute procedure public.touch_updated_at();

alter table public.guests enable row level security;
alter table public.rsvps enable row level security;

-- Public clients cannot read/write tables directly.
-- Next.js API routes use the service role key (bypasses RLS).

insert into public.guests (phone, name, tier)
values
  ('7135550101', 'Jane Doe', 'both'),
  ('7135550102', 'Grandma Smith', 'brunch'),
  ('7135550103', 'Alex Johnson', 'night')
on conflict (phone) do update
set name = excluded.name,
    tier = excluded.tier;
