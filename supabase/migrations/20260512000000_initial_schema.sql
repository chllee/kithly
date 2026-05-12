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
  media_id    uuid        primary key references public.media(id),
  embedding   vector(3072) not null,
  model       text        not null,
  created_at  timestamptz not null default now()
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
create index on public.media_embeddings using hnsw (embedding vector_cosine_ops);


-- ============================================================
-- Functions & Triggers
-- ============================================================

-- Automatically creates a public.users profile row whenever a new user
-- signs up through Supabase Auth. first_name and last_name are pulled
-- from the metadata the app passes at signup time.
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


-- Automatically adds the event creator as an admin member when a new
-- event is created, so they have immediate access without a separate insert.
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
-- Declared SECURITY DEFINER so it bypasses RLS when querying event_members,
-- which prevents infinite recursion in policies that check membership.
-- Returns uuid[] (not setof uuid) so it can be used in RLS policy expressions.
-- Must be VOLATILE (not STABLE) so it isn't cached within INSERT...RETURNING
-- statements — the handle_new_event trigger adds the creator to event_members
-- within the same transaction, and a cached result would miss that new row.
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


-- users
-- Any signed-in user can read non-deleted profiles (needed to show names
-- and avatars on event member lists). Only you can edit your own profile.
create policy "users: read non-deleted"
  on public.users for select
  to authenticated
  using (deleted_at is null);

create policy "users: update own profile"
  on public.users for update
  to authenticated
  using (auth.uid() = id);


-- groups
-- Groups are private to their creator — no one else can see or touch them.
create policy "groups: owner full access"
  on public.groups for all
  to authenticated
  using  (auth.uid() = created_by and deleted_at is null)
  with check (auth.uid() = created_by);


-- group_members
-- The group owner can see and manage all members in their groups.
-- Each member can also see their own membership rows (so they know
-- which groups they have been added to).
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
-- Only members of an event can see it. Any signed-in user can create
-- an event. Only admins of the event can edit its details.
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
-- Any event member can see the full member list for events they belong to.
-- Only admins can add new members or change roles.
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
-- Only event members can see media uploaded to events they belong to.
-- Any event member can upload. Only the uploader can soft-delete their own media.
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
-- Event members can read and post comments on media in their events.
-- Only the commenter can edit or soft-delete their own comments.
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
-- Event members can read all tags on media in their events (tags from all
-- users are visible, which enriches semantic search for everyone).
-- Each user can only add or remove their own tags.
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
-- Favourites are completely private. You can only see and manage your own.
create policy "media_favourites: user manages own"
  on public.media_favourites for all
  to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- media_embeddings
-- Event members can read embeddings for media in their events.
-- No insert/update policy for authenticated users — only the backend
-- AI pipeline (running as service role) writes embeddings.
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
