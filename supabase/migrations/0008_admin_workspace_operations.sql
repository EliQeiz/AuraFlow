-- Administrator operations use the authenticated role rather than a client
-- supplied flag. These policies support the existing owner console while
-- keeping all ordinary users inside their own project boundary.
create policy projects_update_admin on public.projects for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy project_assets_insert_admin on public.project_assets for insert to authenticated with check (public.is_admin() and uploaded_by = auth.uid());
create policy project_events_insert_admin on public.project_events for insert to authenticated with check (public.is_admin() and actor_id = auth.uid());
create policy work_items_admin_write on public.project_work_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant update on public.projects to authenticated;
grant insert on public.project_events to authenticated;
grant select, insert, update on public.project_work_items to authenticated;
grant select, insert, update, delete on public.project_internal_notes to authenticated;

drop policy if exists project_assets_insert_owner on storage.objects;
drop policy if exists project_assets_read_owner on storage.objects;
create policy project_assets_insert_owner on storage.objects for insert to authenticated with check (
  bucket_id = 'project-assets'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
create policy project_assets_read_owner on storage.objects for select to authenticated using (
  bucket_id = 'project-assets'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
