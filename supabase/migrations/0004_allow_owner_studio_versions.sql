-- A draft owner may create immutable revision snapshots for their own draft.
-- They cannot modify or delete a historical version from the browser.

create policy studio_versions_insert_owner
  on public.studio_draft_versions
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.studio_drafts
      where id = draft_id and user_id = auth.uid()
    )
  );

grant insert on public.studio_draft_versions to authenticated;
