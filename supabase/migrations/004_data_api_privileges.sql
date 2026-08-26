-- Supabase no longer auto-grants Data API privileges for new tables.
-- Keep the API surface explicit; RLS policies remain the row-level boundary.

grant usage on schema public to authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.boards to authenticated;
grant select, insert, update, delete on table public.board_members to authenticated;
grant select, insert, update, delete on table public.columns to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;
grant select, insert, update, delete on table public.comments to authenticated;

grant execute on function public.is_board_member(uuid) to authenticated;
grant execute on function public.is_board_owner(uuid) to authenticated;
