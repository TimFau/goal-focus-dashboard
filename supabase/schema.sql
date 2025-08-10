-- Supabase schema for Pulse MVP
create type public.task_category as enum ('career','langpulse','health','life');

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'America/New_York',
  remind_morning time without time zone default '08:30',
  remind_midday  time without time zone default '13:00',
  remind_evening time without time zone default '20:30',
  created_at timestamptz default now()
);

create table if not exists public.week_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text default 'Default',
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.week_templates(id) on delete cascade,
  category task_category not null,
  title text not null,
  low_energy boolean default true,
  sort_index int default 0
);

create table if not exists public.weeks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  week_start date not null,
  created_from_template uuid references public.week_templates(id),
  created_at timestamptz default now(),
  unique(user_id, week_start)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  week_id uuid references public.weeks(id) on delete set null,
  due_date date not null,
  category task_category not null,
  title text not null,
  done boolean default false,
  low_energy boolean default true,
  created_from_template_item uuid references public.template_items(id),
  created_at timestamptz default now()
);

create table if not exists public.daily_focus (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  slot smallint not null check (slot between 1 and 3),
  task_id uuid references public.tasks(id),
  free_text text,
  unique(user_id, date, slot)
);

create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  week_start date not null,
  win_note text,
  friction_note text,
  created_at timestamptz default now(),
  unique(user_id, week_start)
);

-- RLS
alter table public.profiles enable row level security;
alter table public.week_templates enable row level security;
alter table public.template_items enable row level security;
alter table public.weeks enable row level security;
alter table public.tasks enable row level security;
alter table public.daily_focus enable row level security;
alter table public.weekly_reviews enable row level security;

create policy "profiles are self-owned" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "week_templates are self-owned" on public.week_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "template_items inherit ownership" on public.template_items
  for all using (exists (
    select 1 from public.week_templates wt where wt.id = template_id and wt.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.week_templates wt where wt.id = template_id and wt.user_id = auth.uid()
  ));

create policy "weeks are self-owned" on public.weeks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tasks are self-owned" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "daily_focus are self-owned" on public.daily_focus
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "weekly_reviews are self-owned" on public.weekly_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
