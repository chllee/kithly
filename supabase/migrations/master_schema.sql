-- ============================================================
-- MASTER RESET
-- Drops and recreates the entire Kithly database schema.
-- Paste into the Supabase SQL Editor to wipe and start clean.
--
-- Before running:
--   1. Delete the 'media' bucket in the Supabase dashboard:
--      Storage → media → Settings (gear icon) → Delete bucket.
--      (Supabase blocks all direct SQL writes to storage tables.)
--   2. Delete all users in Authentication → Users if you want a
--      fully clean slate (auth.users is managed by Supabase and
--      cannot be dropped here).
-- ============================================================


-- ============================================================
-- Drop storage policies
-- ============================================================

drop policy if exists "event members can upload" on storage.objects;
drop policy if exists "event members can read"   on storage.objects;
drop policy if exists "uploader can delete"      on storage.objects;


-- ============================================================
-- Drop triggers
-- ============================================================

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_event_created     on public.events;


-- ============================================================
-- Drop functions
-- ============================================================

drop function if exists public.handle_new_user();
drop function if exists public.handle_new_event();
drop function if exists public.my_event_ids() cascade;
drop function if exists public.search_media(vector, uuid, int);
drop function if exists public.search_media_in_event(vector, uuid, uuid, int);


-- ============================================================
-- Drop tables (reverse dependency order)
-- ============================================================

drop table if exists public.media_ai_tags    cascade;
drop table if exists public.media_embeddings cascade;
drop table if exists public.media_favourites cascade;
drop table if exists public.media_tags       cascade;
drop table if exists public.media_comments   cascade;
drop table if exists public.media            cascade;
drop table if exists public.event_members    cascade;
drop table if exists public.events           cascade;
drop table if exists public.group_members    cascade;
drop table if exists public.groups           cascade;
drop table if exists public.users            cascade;


-- ============================================================
-- Drop types
-- ============================================================

drop type if exists public.media_type;
drop type if exists public.event_role;


-- ============================================================
-- Extensions
-- ============================================================

create extension if not exists vector;


-- ============================================================
-- Types
-- ============================================================

create type public.media_type as enum ('photo', 'video');
create type public.event_role as enum ('admin', 'member');


-- ============================================================
-- Tables
-- ============================================================

create table public.users (
  id          uuid        primary key references auth.users(id) on delete cascade,
  first_name  text        not null default '',
  last_name   text        not null default '',
  email       text        not null unique,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table public.groups (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  created_by  uuid        not null references public.users(id),
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table public.group_members (
  group_id    uuid        not null references public.groups(id),
  user_id     uuid        not null references public.users(id),
  added_at    timestamptz not null default now(),
  deleted_at  timestamptz,
  primary key (group_id, user_id)
);

create table public.events (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  start_date  date        not null,
  end_date    date,
  location    text,
  created_by  uuid        not null references public.users(id),
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  constraint  events_dates_check check (end_date is null or end_date >= start_date)
);

create table public.event_members (
  event_id    uuid              not null references public.events(id),
  user_id     uuid              not null references public.users(id),
  role        public.event_role not null default 'member',
  joined_at   timestamptz       not null default now(),
  deleted_at  timestamptz,
  primary key (event_id, user_id)
);

create table public.media (
  id           uuid              primary key default gen_random_uuid(),
  event_id     uuid              not null references public.events(id),
  uploaded_by  uuid              not null references public.users(id),
  type         public.media_type not null,
  storage_path text              not null,
  caption      text,
  taken_at     timestamptz,
  latitude     double precision,
  longitude    double precision,
  created_at   timestamptz       not null default now(),
  deleted_at   timestamptz
);

create table public.media_comments (
  id          uuid        primary key default gen_random_uuid(),
  media_id    uuid        not null references public.media(id),
  user_id     uuid        not null references public.users(id),
  content     text        not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  deleted_at  timestamptz
);

create table public.media_tags (
  id          uuid        primary key default gen_random_uuid(),
  media_id    uuid        not null references public.media(id),
  user_id     uuid        not null references public.users(id),
  tag         text        not null,
  created_at  timestamptz not null default now(),
  unique (media_id, user_id, tag)
);

create table public.media_favourites (
  user_id     uuid        not null references public.users(id),
  media_id    uuid        not null references public.media(id),
  created_at  timestamptz not null default now(),
  primary key (user_id, media_id)
);

create table public.media_embeddings (
  media_id    uuid         primary key references public.media(id),
  embedding   vector(3072) not null,
  model       text         not null,
  created_at  timestamptz  not null default now()
);

create table public.media_ai_tags (
  id          uuid        primary key default gen_random_uuid(),
  media_id    uuid        not null references public.media(id),
  tag         text        not null,
  created_at  timestamptz not null default now(),
  unique (media_id, tag)
);


-- ============================================================
-- Indexes
-- ============================================================

create index on public.event_members (user_id);
create index on public.media (event_id);
create index on public.media (uploaded_by);
create index on public.media_comments (media_id);
create index on public.media_tags (media_id, user_id);
create index on public.media_favourites (user_id);
create index on public.media_ai_tags (media_id);


-- ============================================================
-- Functions & Triggers
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into users (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


create or replace function public.handle_new_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into event_members (event_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$;

create trigger on_event_created
  after insert on public.events
  for each row execute function public.handle_new_event();


-- Returns all event IDs the current user is an active member of.
-- VOLATILE (not STABLE) so it is not cached within INSERT...RETURNING —
-- the handle_new_event trigger adds the creator to event_members in the
-- same transaction, and a cached result would miss that new row.
create or replace function public.my_event_ids()
returns uuid[]
language sql
security definer
volatile
set search_path = public
as $$
  select array_agg(event_id)
  from event_members
  where user_id = auth.uid()
  and deleted_at is null;
$$;


-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.users            enable row level security;
alter table public.groups           enable row level security;
alter table public.group_members    enable row level security;
alter table public.events           enable row level security;
alter table public.event_members    enable row level security;
alter table public.media            enable row level security;
alter table public.media_comments   enable row level security;
alter table public.media_tags       enable row level security;
alter table public.media_favourites enable row level security;
alter table public.media_embeddings enable row level security;
alter table public.media_ai_tags    enable row level security;


-- users
create policy "users: read non-deleted"
  on public.users for select
  to authenticated
  using (deleted_at is null);

create policy "users: update own profile"
  on public.users for update
  to authenticated
  using (auth.uid() = id);


-- groups
create policy "groups: owner full access"
  on public.groups for all
  to authenticated
  using  (auth.uid() = created_by and deleted_at is null)
  with check (auth.uid() = created_by);


-- group_members
create policy "group_members: owner manages"
  on public.group_members for all
  to authenticated
  using (
    exists (
      select 1 from public.groups
      where id = group_id
      and created_by = auth.uid()
      and deleted_at is null
    )
  );

create policy "group_members: member reads own"
  on public.group_members for select
  to authenticated
  using (user_id = auth.uid() and deleted_at is null);


-- events
create policy "events: members can read"
  on public.events for select
  to authenticated
  using (deleted_at is null and id = any(public.my_event_ids()));

create policy "events: authenticated users can create"
  on public.events for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "events: admins can update"
  on public.events for update
  to authenticated
  using (
    exists (
      select 1 from public.event_members
      where event_id = id
      and user_id = auth.uid()
      and role = 'admin'
      and deleted_at is null
    )
  );


-- event_members
create policy "event_members: members can read"
  on public.event_members for select
  to authenticated
  using (deleted_at is null and event_id = any(public.my_event_ids()));

create policy "event_members: admins can insert"
  on public.event_members for insert
  to authenticated
  with check (
    exists (
      select 1 from public.event_members em
      where em.event_id = event_id
      and em.user_id = auth.uid()
      and em.role = 'admin'
      and em.deleted_at is null
    )
  );

create policy "event_members: admins can update"
  on public.event_members for update
  to authenticated
  using (
    exists (
      select 1 from public.event_members em
      where em.event_id = event_id
      and em.user_id = auth.uid()
      and em.role = 'admin'
      and em.deleted_at is null
    )
  );


-- media
create policy "media: members can read"
  on public.media for select
  to authenticated
  using (deleted_at is null and event_id = any(public.my_event_ids()));

create policy "media: members can upload"
  on public.media for insert
  to authenticated
  with check (
    auth.uid() = uploaded_by
    and event_id = any(public.my_event_ids())
  );

create policy "media: uploader can update own"
  on public.media for update
  to authenticated
  using (auth.uid() = uploaded_by);


-- media_comments
create policy "media_comments: members can read"
  on public.media_comments for select
  to authenticated
  using (
    deleted_at is null and
    exists (
      select 1 from public.media
      where id = media_id
      and deleted_at is null
      and event_id = any(public.my_event_ids())
    )
  );

create policy "media_comments: members can insert"
  on public.media_comments for insert
  to authenticated
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.media
      where id = media_id
      and deleted_at is null
      and event_id = any(public.my_event_ids())
    )
  );

create policy "media_comments: commenter can update own"
  on public.media_comments for update
  to authenticated
  using (auth.uid() = user_id);


-- media_tags
create policy "media_tags: members can read"
  on public.media_tags for select
  to authenticated
  using (
    exists (
      select 1 from public.media
      where id = media_id
      and deleted_at is null
      and event_id = any(public.my_event_ids())
    )
  );

create policy "media_tags: user manages own"
  on public.media_tags for all
  to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- media_favourites
create policy "media_favourites: user manages own"
  on public.media_favourites for all
  to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- media_embeddings
create policy "media_embeddings: members can read"
  on public.media_embeddings for select
  to authenticated
  using (
    exists (
      select 1 from public.media
      where id = media_id
      and deleted_at is null
      and event_id = any(public.my_event_ids())
    )
  );


-- media_ai_tags
create policy "media_ai_tags: members can read"
  on public.media_ai_tags for select
  to authenticated
  using (
    exists (
      select 1 from public.media
      where id = media_id
      and deleted_at is null
      and event_id = any(public.my_event_ids())
    )
  );


-- ============================================================
-- Search functions
-- ============================================================

create or replace function public.search_media(
  query_embedding vector(3072),
  user_id         uuid,
  match_count     int default 20
)
returns table (
  media_id      uuid,
  event_id      uuid,
  event_name    text,
  storage_path  text,
  caption       text,
  type          public.media_type,
  similarity    float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id          as media_id,
    m.event_id,
    e.name        as event_name,
    m.storage_path,
    m.caption,
    m.type,
    1 - (me.embedding <=> query_embedding) as similarity
  from media_embeddings me
  join media m  on m.id  = me.media_id
  join events e on e.id  = m.event_id
  where m.deleted_at is null
    and 1 - (me.embedding <=> query_embedding) > 0.3
    and m.event_id in (
      select event_id from event_members
      where event_members.user_id = search_media.user_id
      and deleted_at is null
    )
  order by me.embedding <=> query_embedding
  limit match_count;
$$;


create or replace function public.search_media_in_event(
  query_embedding vector(3072),
  user_id         uuid,
  event_id        uuid,
  match_count     int default 20
)
returns table (
  media_id      uuid,
  event_id      uuid,
  event_name    text,
  storage_path  text,
  caption       text,
  type          public.media_type,
  similarity    float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id          as media_id,
    m.event_id,
    e.name        as event_name,
    m.storage_path,
    m.caption,
    m.type,
    1 - (me.embedding <=> query_embedding) as similarity
  from media_embeddings me
  join media m  on m.id  = me.media_id
  join events e on e.id  = m.event_id
  where m.deleted_at is null
    and 1 - (me.embedding <=> query_embedding) > 0.3
    and m.event_id = search_media_in_event.event_id
    and m.event_id in (
      select em.event_id from event_members em
      where em.user_id = search_media_in_event.user_id
      and em.deleted_at is null
    )
  order by me.embedding <=> query_embedding
  limit match_count;
$$;


-- ============================================================
-- Storage bucket
-- ============================================================

insert into storage.buckets (id, name, public)
values ('media', 'media', false);


-- ============================================================
-- Storage policies
-- ============================================================

create policy "event members can upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'media'
  and exists (
    select 1 from public.event_members
    where event_id = (string_to_array(name, '/'))[1]::uuid
    and user_id = auth.uid()
    and deleted_at is null
  )
);

create policy "event members can read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'media'
  and exists (
    select 1 from public.event_members
    where event_id = (string_to_array(name, '/'))[1]::uuid
    and user_id = auth.uid()
    and deleted_at is null
  )
);

create policy "uploader can delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'media'
  and owner = auth.uid()
);
