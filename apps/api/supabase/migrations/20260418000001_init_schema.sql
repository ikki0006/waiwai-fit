-- profiles: 本人のみ read/write
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  avatar_url text,
  slack_user_id text,
  start_weight numeric not null check (start_weight > 0),
  goal_weight numeric not null check (goal_weight > 0),
  started_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goal_lt_start check (goal_weight < start_weight)
);

-- weight_logs: 絶対値の聖域。本人のみ read/write
create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at date not null default current_date,
  weight_kg numeric not null check (weight_kg > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, logged_at)
);

create index weight_logs_user_logged_at_idx on public.weight_logs (user_id, logged_at desc);

-- progress_public: 全員 read、本人のみ write
-- ただしアプリコードから書かれない。weight_logs のトリガーで UPSERT される。
create table public.progress_public (
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  slack_user_id text,
  logged_at date not null,
  progress_from_start_pct numeric not null,
  goal_achievement_pct numeric not null,
  weekly_delta_pct numeric,
  streak_days int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, logged_at)
);

create index progress_public_logged_at_idx on public.progress_public (logged_at desc);
