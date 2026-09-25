-- Calls can belong to either a delivery project or the private support inbox.
alter table public.calls add column if not exists conversation_id uuid references public.support_conversations(id) on delete cascade;
alter table public.calls add constraint calls_scope_check check (project_id is not null or conversation_id is not null);

create policy calls_update_participant on public.calls for update to authenticated using (
  client_id = auth.uid() or created_by = auth.uid() or public.is_admin()
) with check (
  client_id = auth.uid() or created_by = auth.uid() or public.is_admin()
);
create policy call_participants_write on public.call_participants for all to authenticated using (
  user_id = auth.uid() or public.is_admin()
) with check (user_id = auth.uid() or public.is_admin());

drop policy if exists call_signals_insert on public.call_signals;
create policy call_signals_insert on public.call_signals for insert to authenticated with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.calls
    where id = call_id and (client_id = auth.uid() or created_by = auth.uid() or public.is_admin())
  )
);

grant update on public.calls to authenticated;
grant select, insert, update on public.call_participants to authenticated;
grant insert on public.call_signals to authenticated;
