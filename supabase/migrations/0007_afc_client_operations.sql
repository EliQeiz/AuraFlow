-- AFC browser operations are limited to a learner's own records. Instructor
-- operations remain gated by is_admin(), and answer keys/audit records never
-- receive a browser policy or grant.
create policy afc_enrollments_insert_free_course on public.afc_enrollments for insert to authenticated with check (
  user_id = auth.uid()
  and status = 'active'
  and exists (select 1 from public.afc_courses where id = course_id and published = true and price_ghs = 0)
);
create policy afc_requests_admin_update on public.afc_enrollment_requests for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy afc_submissions_admin_update on public.afc_submissions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy afc_certificates_admin_write on public.afc_certificates for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy afc_enrollments_admin_write on public.afc_enrollments for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant insert, update, delete on public.afc_courses to authenticated;
grant insert, update on public.afc_enrollments to authenticated;
grant update on public.afc_enrollment_requests, public.afc_submissions to authenticated;
grant insert, update, delete on public.afc_certificates to authenticated;
