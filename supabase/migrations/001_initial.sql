-- TaskFlow initial schema

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  avatar_url text
);

create table boards (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now()
);

create table board_members (
  id        uuid primary key default gen_random_uuid(),
  board_id  uuid not null references boards(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  unique(board_id, user_id)
);

create table columns (
  id        uuid primary key default gen_random_uuid(),
  board_id  uuid not null references boards(id) on delete cascade,
  title     text not null,
  position  integer not null default 0
);

create table tasks (
  id          uuid primary key default gen_random_uuid(),
  column_id   uuid not null references columns(id) on delete cascade,
  title       text not null,
  description text,
  priority    text default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date    date,
  assignee_id uuid references auth.users(id),
  position    integer not null default 0,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz default now()
);

create table comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references tasks(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  content    text not null,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-add owner as board member
create or replace function public.handle_new_board()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.board_members (board_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_board_created
  after insert on boards
  for each row execute procedure public.handle_new_board();

-- Default columns on board creation
create or replace function public.create_default_columns()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.columns (board_id, title, position) values
    (new.id, 'To Do', 0),
    (new.id, 'In Progress', 1),
    (new.id, 'Done', 2);
  return new;
end;
$$;

create trigger on_board_created_columns
  after insert on boards
  for each row execute procedure public.create_default_columns();

-- RLS
alter table profiles enable row level security;
alter table boards enable row level security;
alter table board_members enable row level security;
alter table columns enable row level security;
alter table tasks enable row level security;
alter table comments enable row level security;

create or replace function public.is_board_member(board uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from board_members
    where board_id = board and user_id = auth.uid()
  );
$$;

create or replace function public.is_board_owner(board uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from boards
    where id = board and owner_id = auth.uid()
  );
$$;

-- Profiles
create policy "Profiles are viewable by authenticated users"
  on profiles for select to authenticated using (true);

create policy "Users can update own profile"
  on profiles for update to authenticated using (id = auth.uid());

create policy "Users can insert own profile"
  on profiles for insert to authenticated with check (id = auth.uid());

-- Boards
create policy "Members can view boards"
  on boards for select to authenticated
  using (public.is_board_member(id));

create policy "Authenticated users can create boards"
  on boards for insert to authenticated with check (owner_id = auth.uid());

create policy "Owner can update board"
  on boards for update to authenticated using (owner_id = auth.uid());

create policy "Owner can delete board"
  on boards for delete to authenticated using (owner_id = auth.uid());

-- Board members
create policy "Members can view board members"
  on board_members for select to authenticated
  using (public.is_board_member(board_id));

create policy "Owner can manage members"
  on board_members for all to authenticated
  using (public.is_board_owner(board_id))
  with check (public.is_board_owner(board_id));

create policy "Users can view own membership"
  on board_members for select to authenticated using (user_id = auth.uid());

-- Columns
create policy "Members can view columns"
  on columns for select to authenticated
  using (public.is_board_member(board_id));

create policy "Members can manage columns"
  on columns for all to authenticated
  using (public.is_board_member(board_id))
  with check (public.is_board_member(board_id));

-- Tasks
create policy "Members can view tasks"
  on tasks for select to authenticated
  using (
    column_id in (
      select c.id from columns c
      where public.is_board_member(c.board_id)
    )
  );

create policy "Members can manage tasks"
  on tasks for all to authenticated
  using (
    column_id in (
      select c.id from columns c
      where public.is_board_member(c.board_id)
    )
  )
  with check (
    column_id in (
      select c.id from columns c
      where public.is_board_member(c.board_id)
    )
  );

-- Comments
create policy "Members can view comments"
  on comments for select to authenticated
  using (
    task_id in (
      select t.id from tasks t
      join columns c on c.id = t.column_id
      where public.is_board_member(c.board_id)
    )
  );

create policy "Members can manage own comments"
  on comments for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete own comments"
  on comments for delete to authenticated using (user_id = auth.uid());

-- Realtime
alter publication supabase_realtime add table columns;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table board_members;
