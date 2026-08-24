-- Avatars storage bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Authenticated users can upload avatars into their own folder
create policy "Users can upload own avatars"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own avatars"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own avatars"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Avatars are publicly readable"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars');

create policy "Avatars are publicly readable anon"
  on storage.objects for select to anon
  using (bucket_id = 'avatars');

-- Invite board member by email (owner only)
create or replace function public.invite_member_by_email(p_board_id uuid, p_email text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not public.is_board_owner(p_board_id) then
    raise exception 'Only board owner can invite members';
  end if;

  select id into v_user_id
  from auth.users
  where lower(email) = lower(trim(p_email));

  if v_user_id is null then
    raise exception 'User with email % not found', p_email;
  end if;

  insert into public.board_members (board_id, user_id, role)
  values (p_board_id, v_user_id, 'member')
  on conflict (board_id, user_id) do nothing;

  return v_user_id;
end;
$$;

grant execute on function public.invite_member_by_email(uuid, text) to authenticated;
