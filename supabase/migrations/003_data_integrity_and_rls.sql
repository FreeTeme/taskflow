-- Tighten board permissions and make task ordering updates atomic.

-- Only board owners may change the column structure. Board members keep read
-- access through the existing "Members can view columns" policy.
drop policy if exists "Members can manage columns" on public.columns;

create policy "Owners can insert columns"
  on public.columns for insert to authenticated
  with check (public.is_board_owner(board_id));

create policy "Owners can update columns"
  on public.columns for update to authenticated
  using (public.is_board_owner(board_id))
  with check (public.is_board_owner(board_id));

create policy "Owners can delete columns"
  on public.columns for delete to authenticated
  using (public.is_board_owner(board_id));

-- A comment author must also be a member of the board that contains the task.
drop policy if exists "Members can manage own comments" on public.comments;
drop policy if exists "Users can delete own comments" on public.comments;

create policy "Members can insert own comments"
  on public.comments for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.tasks t
      join public.columns c on c.id = t.column_id
      where t.id = task_id
        and public.is_board_member(c.board_id)
    )
  );

create policy "Members can delete own comments"
  on public.comments for delete to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.tasks t
      join public.columns c on c.id = t.column_id
      where t.id = task_id
        and public.is_board_member(c.board_id)
    )
  );

-- Cross-table membership cannot be expressed as a regular CHECK constraint.
-- Enforce it for both assignment changes and moves to another board.
create or replace function public.enforce_task_assignee_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_board_id uuid;
  source_board_id uuid;
begin
  select c.board_id
  into target_board_id
  from public.columns c
  where c.id = new.column_id;

  -- The product supports moving tasks between columns of one board only.
  -- Apply the boundary to direct table updates as well as reorder_tasks RPC.
  if tg_op = 'UPDATE' and new.column_id is distinct from old.column_id then
    select c.board_id
    into source_board_id
    from public.columns c
    where c.id = old.column_id;

    if source_board_id is distinct from target_board_id then
      raise exception 'Tasks cannot be moved between boards'
        using errcode = '23514',
              constraint = 'tasks_column_stays_on_board';
    end if;
  end if;

  if new.assignee_id is null then
    return new;
  end if;

  if target_board_id is null or not exists (
    select 1
    from public.board_members bm
    where bm.board_id = target_board_id
      and bm.user_id = new.assignee_id
  ) then
    raise exception 'Task assignee must be a member of the board'
      using errcode = '23514',
            constraint = 'tasks_assignee_is_board_member';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_task_assignee_membership() from public;

drop trigger if exists enforce_task_assignee_membership on public.tasks;
create trigger enforce_task_assignee_membership
  before insert or update of assignee_id, column_id on public.tasks
  for each row execute function public.enforce_task_assignee_membership();

-- Repair legacy assignments (including assignments left behind after a member
-- was removed) before maintaining the invariant for future membership changes.
update public.tasks t
set assignee_id = null
from public.columns c
where c.id = t.column_id
  and t.assignee_id is not null
  and not exists (
    select 1
    from public.board_members bm
    where bm.board_id = c.board_id
      and bm.user_id = t.assignee_id
  );

create or replace function public.unassign_tasks_for_removed_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tasks t
  set assignee_id = null
  from public.columns c
  where c.id = t.column_id
    and c.board_id = old.board_id
    and t.assignee_id = old.user_id;

  return old;
end;
$$;

revoke all on function public.unassign_tasks_for_removed_member() from public;

drop trigger if exists unassign_tasks_for_removed_member on public.board_members;
create trigger unassign_tasks_for_removed_member
  after delete or update of board_id, user_id on public.board_members
  for each row execute function public.unassign_tasks_for_removed_member();

-- A PostgreSQL function executes in the caller's transaction, so either every
-- requested task move succeeds or the entire reorder is rolled back. The
-- existing task RLS policy still controls both source and destination rows.
create or replace function public.reorder_tasks(p_updates jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  payload_count integer;
  updated_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_updates is null or jsonb_typeof(p_updates) <> 'array' then
    raise exception 'p_updates must be a JSON array' using errcode = '22023';
  end if;

  payload_count := jsonb_array_length(p_updates);
  if payload_count = 0 then
    return;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_updates) item
    where not (item ? 'id')
       or not (item ? 'column_id')
       or not (item ? 'position')
       or jsonb_typeof(item->'id') <> 'string'
       or jsonb_typeof(item->'column_id') <> 'string'
       or jsonb_typeof(item->'position') <> 'number'
       or (item->>'position') !~ '^(0|[1-9][0-9]{0,9})$'
  ) then
    raise exception 'Each task update requires id, column_id, and a non-negative integer position'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_updates) item
    where (item->>'position')::numeric > 2147483647
  ) then
    raise exception 'Task position exceeds the PostgreSQL integer range'
      using errcode = '22003';
  end if;

  if (
    select count(distinct item->>'id')
    from jsonb_array_elements(p_updates) item
  ) <> payload_count then
    raise exception 'Task updates must not contain duplicate ids'
      using errcode = '22023';
  end if;

  -- Even a caller who is a member of both boards cannot cross the board
  -- boundary through this RPC.
  if exists (
    with requested as (
      select
        (item->>'id')::uuid as id,
        (item->>'column_id')::uuid as column_id
      from jsonb_array_elements(p_updates) item
    )
    select 1
    from requested r
    join public.tasks t on t.id = r.id
    join public.columns source_column on source_column.id = t.column_id
    join public.columns target_column on target_column.id = r.column_id
    where source_column.board_id <> target_column.board_id
  ) then
    raise exception 'Task reorder cannot move tasks between boards'
      using errcode = '22023';
  end if;

  with requested as (
    select
      (item->>'id')::uuid as id,
      (item->>'column_id')::uuid as column_id,
      (item->>'position')::integer as position
    from jsonb_array_elements(p_updates) item
  ), changed as (
    update public.tasks t
    set column_id = requested.column_id,
        position = requested.position
    from requested
    where t.id = requested.id
    returning t.id
  )
  select count(*) into updated_count from changed;

  if updated_count <> payload_count then
    raise exception 'One or more tasks do not exist or are not accessible'
      using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.reorder_tasks(jsonb) from public;
grant execute on function public.reorder_tasks(jsonb) to authenticated;
