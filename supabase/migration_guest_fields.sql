-- Clear data, add guest name/email fields, reseed test guests.
-- Supabase: SQL Editor → New query → paste → Run.

-- 1) Delete all existing rows (RSVPs first because of guest_id FK)
truncate table public.rsvps restart identity cascade;
truncate table public.guests restart identity cascade;

-- 2) Column updates
alter table public.guests
  alter column phone drop not null;

alter table public.guests
  add column if not exists email text;

alter table public.guests
  add column if not exists first_name text;

alter table public.guests
  add column if not exists last_name text;

alter table public.guests
  add column if not exists addressee text;

alter table public.rsvps
  add column if not exists guest_first_name text;

alter table public.rsvps
  add column if not exists guest_last_name text;

-- Fill any nulls, then enforce defaults / not-null
update public.guests set first_name = coalesce(first_name, '');
update public.guests set last_name = coalesce(last_name, '');
update public.guests set addressee = coalesce(addressee, '');
update public.rsvps set guest_first_name = coalesce(guest_first_name, '');
update public.rsvps set guest_last_name = coalesce(guest_last_name, '');

alter table public.guests
  alter column first_name set default '',
  alter column first_name set not null;

alter table public.guests
  alter column last_name set default '',
  alter column last_name set not null;

alter table public.guests
  alter column addressee set default '',
  alter column addressee set not null;

alter table public.rsvps
  alter column guest_first_name set default '',
  alter column guest_first_name set not null;

alter table public.rsvps
  alter column guest_last_name set default '',
  alter column guest_last_name set not null;

create unique index if not exists guests_email_unique_idx
  on public.guests (lower(email))
  where email is not null and email <> '';

-- 3) Seed test guests
insert into public.guests (phone, email, first_name, last_name, addressee, name, tier)
values
  ('7135550101', 'jane@example.com', 'Jane', 'Doe', 'The Doe Family', 'Jane Doe', 'both'),
  ('7135550102', 'grandma@example.com', 'Grandma', 'Smith', 'The Smith Family', 'Grandma Smith', 'brunch'),
  ('7135550103', 'alex@example.com', 'Alex', 'Johnson', 'The Johnson Family', 'Alex Johnson', 'night')
on conflict (phone) do update
set
  email = excluded.email,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  addressee = excluded.addressee,
  name = excluded.name,
  tier = excluded.tier;
