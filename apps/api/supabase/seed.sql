-- ローカル開発用ダミーデータ
-- 9人 × 90日分の体重ログを投入し、トリガーで progress_public が自動生成される
-- 実行: `supabase db reset` (migrations 適用後にこのファイルが実行される)

-- 既存ダミーデータを掃除(冪等にするため)
delete from auth.users where email like '%@dummy.local';

-- 9人分の auth.users + profiles を作成
do $$
declare
  dummy_users text[][] := array[
    array['11111111-1111-1111-1111-111111111111', 'joy@dummy.local',    'joy',    '70', '63'],
    array['22222222-2222-2222-2222-222222222222', 'iwaki@dummy.local',  'iwaki',  '78', '70'],
    array['33333333-3333-3333-3333-333333333333', 'mori@dummy.local',   'mori',   '85', '75'],
    array['44444444-4444-4444-4444-444444444444', 'mizuno@dummy.local', 'mizuno', '68', '60'],
    array['55555555-5555-5555-5555-555555555555', 'kazuki@dummy.local', 'kazuki', '92', '80'],
    array['66666666-6666-6666-6666-666666666666', 'yuki@dummy.local',   'yuki',   '60', '55'],
    array['77777777-7777-7777-7777-777777777777', 'tanaka@dummy.local', 'tanaka', '75', '68'],
    array['88888888-8888-8888-8888-888888888888', 'sato@dummy.local',   'sato',   '82', '72'],
    array['99999999-9999-9999-9999-999999999999', 'naka@dummy.local',   'naka',   '70', '62']
  ];
  rec text[];
  uid uuid;
  start_w numeric;
  goal_w numeric;
  total_drop numeric;
  day_offset int;
  curr_weight numeric;
  noise numeric;
  -- ユーザーごとに進捗の傾きを変える(0.0〜1.2倍、超えるとオーバーシュート)
  progress_factors numeric[] := array[1.10, 0.85, 0.95, 1.20, 0.50, 1.05, 0.75, 0.30, 0.90];
  user_index int := 0;
begin
  foreach rec slice 1 in array dummy_users loop
    user_index := user_index + 1;
    uid := rec[1]::uuid;
    start_w := rec[4]::numeric;
    goal_w := rec[5]::numeric;
    total_drop := (start_w - goal_w) * progress_factors[user_index];

    -- auth.users に最低限のレコードを差し込む(ローカル開発限定)
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
    ) values (
      uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      rec[2],
      crypt('dummy-password', gen_salt('bf')),
      now(),
      now() - interval '90 days',
      now(),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('name', rec[3]),
      false,
      false
    );

    insert into public.profiles (
      user_id, email, display_name, avatar_url, slack_user_id,
      start_weight, goal_weight, started_at
    ) values (
      uid, rec[2], rec[3], null, null,
      start_w, goal_w, (current_date - interval '90 days')::date
    );

    -- 90日分の体重ログ(89日前〜今日)。線形に減らしつつ ±0.4kg のノイズを乗せる
    for day_offset in 0..89 loop
      noise := (random() - 0.5) * 0.8;
      curr_weight := start_w - (total_drop * day_offset / 89.0) + noise;
      if curr_weight <= 0 then curr_weight := 0.1; end if;

      insert into public.weight_logs (user_id, logged_at, weight_kg)
      values (
        uid,
        (current_date - interval '89 days' + (day_offset || ' days')::interval)::date,
        round(curr_weight::numeric, 1)
      );
    end loop;
  end loop;
end $$;
