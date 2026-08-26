-- In-app board invitations. The membership grant and notification are created
-- in the same transaction so the invited board appears immediately.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  board_id uuid not null references public.boards(id) on delete cascade,
  type text not null default 'board_invite' check (type in ('board_invite')),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, board_id, type)
);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

create policy "Users can mark own notifications as read"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, update on table public.notifications to authenticated;

alter publication supabase_realtime add table public.notifications;

create or replace function public.invite_member_by_email(p_board_id uuid, p_email text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid;
  v_inserted_count integer;
begin
  if not public.is_board_owner(p_board_id) then
    raise exception 'Only board owner can invite members';
  end if;

  select id into v_user_id
  from auth.users
  where lower(email) = lower(trim(p_email));

  if v_user_id is null then
    raise exception 'No TaskFlow account found for this email';
  end if;

  if v_user_id = auth.uid() then
    raise exception 'You are already the owner of this board';
  end if;

  insert into public.board_members (board_id, user_id, role)
  values (p_board_id, v_user_id, 'member')
  on conflict (board_id, user_id) do nothing;

  get diagnostics v_inserted_count = row_count;

  if v_inserted_count > 0 then
    insert into public.notifications (user_id, actor_id, board_id, type)
    values (v_user_id, auth.uid(), p_board_id, 'board_invite')
    on conflict (user_id, board_id, type) do update
      set actor_id = excluded.actor_id,
          read_at = null,
          created_at = now();
  end if;

  return v_user_id;
end;
$$;

grant execute on function public.invite_member_by_email(uuid, text) to authenticated;
