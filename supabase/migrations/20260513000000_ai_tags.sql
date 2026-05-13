create table public.media_ai_tags (
  id          uuid        primary key default gen_random_uuid(),
  media_id    uuid        not null references public.media(id),
  tag         text        not null,
  created_at  timestamptz not null default now(),
  unique (media_id, tag)
);

create index on public.media_ai_tags (media_id);

alter table public.media_ai_tags enable row level security;

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
