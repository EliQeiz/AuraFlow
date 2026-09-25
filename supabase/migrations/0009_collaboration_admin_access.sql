-- Customer messages stay private; administrators may participate through an
-- authenticated role check rather than an untrusted UI flag.
create policy project_messages_insert_admin on public.project_messages for insert to authenticated with check (
  public.is_admin() and author_id = auth.uid() and role = 'admin'
);
create policy support_messages_insert_admin on public.support_messages for insert to authenticated with check (
  public.is_admin() and author_id = auth.uid() and role = 'admin'
);

drop policy if exists conversation_media_private on storage.objects;
create policy conversation_media_private on storage.objects for all to authenticated using (
  bucket_id = 'conversation-media'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
) with check (
  bucket_id = 'conversation-media'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
