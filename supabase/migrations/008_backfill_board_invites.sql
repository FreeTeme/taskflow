-- Give existing non-owner members the same in-app invitation experience.

insert into public.notifications (user_id, actor_id, board_id, type)
select bm.user_id, b.owner_id, b.id, 'board_invite'
from public.board_members bm
join public.boards b on b.id = bm.board_id
where bm.role = 'member'
  and bm.user_id <> b.owner_id
on conflict (user_id, board_id, type) do nothing;
