-- ============================================================
-- Storage bucket
-- ============================================================

insert into storage.buckets (id, name, public)
values ('media', 'media', false);


-- ============================================================
-- Storage policies
-- ============================================================

-- Event members can upload to their event's folder
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

-- Event members can read media from their events
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

-- Uploaders can delete their own files
create policy "uploader can delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'media'
  and owner = auth.uid()
);
