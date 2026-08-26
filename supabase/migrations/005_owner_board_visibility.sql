-- Board creation returns the inserted row in the same PostgREST statement.
-- Let the owner see that row directly instead of depending only on the
-- board_members row created by an AFTER INSERT trigger.

drop policy if exists "Members can view boards" on public.boards;

create policy "Members can view boards"
  on public.boards for select to authenticated
  using (owner_id = auth.uid() or public.is_board_member(id));
