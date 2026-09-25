-- Atomic server-side quota consumption. The function is deliberately not
-- granted to browser roles; API routes call it through the service-role client.
create or replace function public.consume_api_rate_limit(
  p_scope text,
  p_subject_hash text,
  p_max_requests integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  accepted boolean := false;
begin
  if char_length(p_scope) < 1 or char_length(p_scope) > 80
    or char_length(p_subject_hash) < 16 or char_length(p_subject_hash) > 128
    or p_max_requests < 1 or p_max_requests > 10000 then
    raise exception 'invalid rate limit input';
  end if;

  insert into public.api_rate_limits as limits (scope, subject_hash, window_minute, request_count)
  values (p_scope, p_subject_hash, floor(extract(epoch from now()) / 60)::bigint, 1)
  on conflict (scope, subject_hash, window_minute) do update
    set request_count = limits.request_count + 1,
        updated_at = now()
    where limits.request_count < p_max_requests
  returning true into accepted;

  return coalesce(accepted, false);
end;
$$;

revoke all on function public.consume_api_rate_limit(text, text, integer) from public;
