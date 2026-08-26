-- Return a clear product error instead of reporting success for an existing member.

create or replace function public.invite_member_by_email(p_board_id uuid, p_email text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not public.is_board_owner(p_board_id) then
    raise exception 'Only the board owner can invite members';
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

  if exists (
    select 1
    from public.board_members
    where board_id = p_board_id and user_id = v_user_id
  ) then
    raise exception 'This person is already a board member';
  end if;

  insert into public.board_members (board_id, user_id, role)
  values (p_board_id, v_user_id, 'member');

  insert into public.notifications (user_id, actor_id, board_id, type)
  values (v_user_id, auth.uid(), p_board_id, 'board_invite')
  on conflict (user_id, board_id, type) do update
    set actor_id = excluded.actor_id,
        read_at = null,
        created_at = now();

  return v_user_id;
end;
$$;

grant execute on function public.invite_member_by_email(uuid, text) to authenticated;
