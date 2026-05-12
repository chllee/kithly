-- Semantic search across all events the user is a member of
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


-- Semantic search scoped to a single event
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
