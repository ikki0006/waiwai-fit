-- profiles
alter table public.profiles enable row level security;

create policy "profiles_select_self"
  on public.profiles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profiles_delete_self"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = user_id);

-- weight_logs: 絶対値の聖域
alter table public.weight_logs enable row level security;

create policy "weight_logs_select_self"
  on public.weight_logs for select
  to authenticated
  using (auth.uid() = user_id);

create policy "weight_logs_insert_self"
  on public.weight_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "weight_logs_update_self"
  on public.weight_logs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "weight_logs_delete_self"
  on public.weight_logs for delete
  to authenticated
  using (auth.uid() = user_id);

-- progress_public: 全員 read、本人のみ write
-- 重要: insert/update/delete は RLS で auth.uid() = user_id に絞るが、
-- アプリから直接書くのは禁止。トリガー経由でしか書かないことで秘匿を保証する。
alter table public.progress_public enable row level security;

create policy "progress_public_select_authenticated"
  on public.progress_public for select
  to authenticated
  using (true);

create policy "progress_public_insert_self"
  on public.progress_public for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "progress_public_update_self"
  on public.progress_public for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "progress_public_delete_self"
  on public.progress_public for delete
  to authenticated
  using (auth.uid() = user_id);
