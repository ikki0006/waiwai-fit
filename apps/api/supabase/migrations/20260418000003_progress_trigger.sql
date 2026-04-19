-- weight_logs の INSERT/UPDATE で progress_public を自動 UPSERT
-- アプリコードから progress_public に weight_kg が書かれないことを担保する唯一の経路

create or replace function public.upsert_progress_public()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_week_ago_weight numeric;
  v_progress_pct numeric;
  v_goal_pct numeric;
  v_weekly_delta_pct numeric;
  v_streak int;
  v_yesterday_exists boolean;
begin
  select * into v_profile from public.profiles where user_id = new.user_id;
  if not found then
    raise exception 'profile not found for user_id=%', new.user_id;
  end if;

  -- メイン指標: 開始時点からの増減% (減量側はマイナス)
  v_progress_pct := (new.weight_kg - v_profile.start_weight) / v_profile.start_weight * 100;

  -- サブ指標: 目標到達度% (0〜100+)
  v_goal_pct := (v_profile.start_weight - new.weight_kg)
                / nullif(v_profile.start_weight - v_profile.goal_weight, 0) * 100;

  -- 週比: 7日前の記録があれば計算、無ければ null
  select weight_kg into v_week_ago_weight
    from public.weight_logs
    where user_id = new.user_id
      and logged_at = new.logged_at - interval '7 days'
    limit 1;

  if v_week_ago_weight is not null then
    v_weekly_delta_pct := (new.weight_kg - v_week_ago_weight) / v_week_ago_weight * 100;
  else
    v_weekly_delta_pct := null;
  end if;

  -- streak: 前日のprogress_publicを引いて連続日数を伸ばす
  select exists (
    select 1 from public.progress_public
    where user_id = new.user_id
      and logged_at = new.logged_at - interval '1 day'
  ) into v_yesterday_exists;

  if v_yesterday_exists then
    select streak_days + 1 into v_streak
      from public.progress_public
      where user_id = new.user_id
        and logged_at = new.logged_at - interval '1 day';
  else
    v_streak := 1;
  end if;

  insert into public.progress_public (
    user_id, display_name, avatar_url, slack_user_id, logged_at,
    progress_from_start_pct, goal_achievement_pct, weekly_delta_pct,
    streak_days, updated_at
  )
  values (
    new.user_id, v_profile.display_name, v_profile.avatar_url, v_profile.slack_user_id,
    new.logged_at, v_progress_pct, v_goal_pct, v_weekly_delta_pct,
    v_streak, now()
  )
  on conflict (user_id, logged_at) do update set
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    slack_user_id = excluded.slack_user_id,
    progress_from_start_pct = excluded.progress_from_start_pct,
    goal_achievement_pct = excluded.goal_achievement_pct,
    weekly_delta_pct = excluded.weekly_delta_pct,
    streak_days = excluded.streak_days,
    updated_at = now();

  return new;
end;
$$;

create trigger trg_weight_logs_upsert_progress
  after insert or update on public.weight_logs
  for each row
  execute function public.upsert_progress_public();

-- profiles の display_name / avatar_url / slack_user_id 更新を progress_public に反映
create or replace function public.sync_profile_to_progress_public()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.display_name is distinct from old.display_name
     or new.avatar_url is distinct from old.avatar_url
     or new.slack_user_id is distinct from old.slack_user_id then
    update public.progress_public
      set display_name = new.display_name,
          avatar_url = new.avatar_url,
          slack_user_id = new.slack_user_id,
          updated_at = now()
      where user_id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger trg_profiles_sync_progress
  after update on public.profiles
  for each row
  execute function public.sync_profile_to_progress_public();

-- updated_at を自動更新
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_touch_updated_at
  before update on public.profiles
  for each row
  execute function public.touch_updated_at();

create trigger trg_weight_logs_touch_updated_at
  before update on public.weight_logs
  for each row
  execute function public.touch_updated_at();
