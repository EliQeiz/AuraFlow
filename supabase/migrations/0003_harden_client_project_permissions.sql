-- Keep client-created project requests constrained to client-owned fields.
-- Staff-controlled delivery, status, tenancy, and audit fields are written only
-- by authenticated server routes using the service-role client.

revoke insert, update on public.projects from authenticated;

grant insert (
  user_id,
  client_name,
  client_email,
  title,
  project_type,
  description,
  audience,
  budget,
  timeline,
  reference_links,
  template_slug,
  solution_slug,
  platform_mode,
  subdomain_preference,
  prototype_spec,
  design,
  design_draft_id
) on public.projects to authenticated;

grant update (last_client_note) on public.projects to authenticated;

drop policy if exists project_assets_insert on public.project_assets;
create policy project_assets_insert
  on public.project_assets
  for insert
  to authenticated
  with check (
    public.owns_project(project_id)
    and uploaded_by = auth.uid()
    and kind in ('reference', 'content')
    and storage_path like auth.uid()::text || '/%'
  );
