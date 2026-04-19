# 社内ダイエットアプリ「(仮)Diet Waiwai」設計引き継ぎ

## プロジェクト概要

社内10人規模で使う、ワイワイできるダイエットアプリ。
体重の絶対値は本人だけ、他人には相対値(%)だけ見えるようにして心理的ハードルを下げつつ、Slackで煽り合えるようにする。

## 要件

- **秘匿**: 体重の絶対値は本人のみ閲覧可。他人からは相対値(%)のみ見える
- **進捗表示**:
  - メイン指標(目立たせる): **開始時点からの増減%**(ドラマが出やすい)
  - サブ指標(小さく): **目標到達度%**(ゴールまでの距離)
- **ワイワイ**: Slack連携(日次ボード投稿、リアクションで煽り合い)
- **規模**: 10人程度
- **予算**: プライベート扱いなので月数百円以内に収めたい

## インフラ構成

- **フロント**: React Router v7 + Cloudflare Pages
- **API**: Hono + oRPC on Cloudflare Workers
- **DB**: Supabase(Postgres + RLS + Auth)
- **認証**: Supabase Auth標準のGoogle OAuth(Workspaceドメインで絞る想定)
- **Slack連携**: Workers Cronで毎朝9:00に `#diet-waiwai` 的なchへ進捗ボード投稿
- **Claude**: Anthropic API直叩き、週次サマリ&応援コメント生成
- **MCP**: 将来拡張。`/mcp` パスだけ予約、初期実装なし
- **コスト見込み**: 月0〜300円(Claude API従量分のみ)

## 認証設計

- Supabase Auth標準のGoogle OAuthプロバイダを使用(自前JWT発行は不要)
- スコープ: `openid email profile`
- `queryParams: { hd: '<会社ドメイン>' }` でWorkspace限定
- 取得できる情報: `sub`, `email`, `name`, `given_name`, `family_name`, `picture`, `hd`
- Slack User IDはログイン後にSlack API `users.lookupByEmail` で自動マッチ(Slack Bot Tokenに `users:read.email` スコープ必須)

## データモデル(Postgres / Supabase)

### profiles(本人のみ read/write)

```sql
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,   -- Googleのname
  avatar_url text,              -- Googleのpicture
  slack_user_id text,           -- メールマッチで自動取得
  start_weight numeric not null,
  goal_weight numeric not null,
  started_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

RLS: `auth.uid() = user_id` でread/write許可。

### weight_logs(本人のみ read/write — 絶対値が入る聖域)

```sql
create table weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at date not null default current_date,
  weight_kg numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, logged_at)
);
```

RLS: `auth.uid() = user_id` でread/write許可。**他人は絶対に読めない。**

`created_at` は初回INSERT時刻を保持、`updated_at` はINSERT/UPDATE両方でトリガーにより `now()` に更新される。
過去日を後日入力・上書きしたときも `created_at` は最初の記録時刻のまま残る。

### progress_public(全員 read、本人のみ write — トリガーで自動生成)

```sql
create table progress_public (
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  slack_user_id text,
  logged_at date not null,
  progress_from_start_pct numeric not null,  -- メイン: 開始時点からの増減%(減はマイナス)
  goal_achievement_pct numeric not null,     -- サブ: 目標到達度%(0〜100+)
  weekly_delta_pct numeric,                  -- 7日前比(7日前logが無ければnull)
  streak_days int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, logged_at)
);
```

RLS:

- select: 認証済みユーザー全員許可
- insert/update/delete: `auth.uid() = user_id` のみ

**ポイント**: アプリ層では絶対にpublic側に生値(体重kg)を書かない。トリガーで `weight_logs` INSERT時に相対値だけ計算してUPSERTする。

### トリガー実装方針

```
weight_logs INSERT/UPDATE
  ↓ trigger
profilesからstart_weight, goal_weight, display_name, avatar_url, slack_user_idを引く
  ↓
progress_from_start_pct = (weight_kg - start_weight) / start_weight * 100
goal_achievement_pct = (start_weight - weight_kg) / (start_weight - goal_weight) * 100
weekly_delta_pct = 7日前logがあれば (今日 - 7日前) / 7日前 * 100、無ければnull
streak_days = 連続記録日数
  ↓ UPSERT
progress_public
```

## 指標計算の定義(確定仕様)

- **progress_from_start_pct**(メイン・デカ表示)
  - `(current_weight - start_weight) / start_weight * 100`
  - 減量できていればマイナス値(例: -4.0%)
  - グラフとデカ文字で表示
- **goal_achievement_pct**(サブ・小さく)
  - `(start_weight - current_weight) / (start_weight - goal_weight) * 100`
  - 0%スタート、100%で目標達成
  - プログレスバーで表示
- **weekly_delta_pct**: 7日前比。体重は日次だと水分変動で揺れるので週次を採用。7日前log無ければnull

## 画面構成(最小)

- `/login`: Googleログイン
- `/onboarding`: 初回のみ、start_weight/goal_weightを入力
- `/`: 自分のダッシュボード
  - 今日の記録フォーム
  - 自分の推移グラフ(絶対値OK、本人だけだから)
  - メイン指標デカ表示、サブ指標プログレスバー
- `/board`: みんなの進捗ボード(相対値のみ)
  - ランキング、streak、アバター、名前
- `/settings`: 目標値の変更、Slack連携確認

## Slackボード投稿イメージ

```
🔥 今日のダイエット進捗 YYYY/MM/DD

🥇 @joy    -5.2%  ████████░░ ゴール達成度 68%  🔥7日連続
🥈 @iwaki  -3.1%  █████░░░░░ 41%              ⚡3日連続
🥉 @mori   -2.4%  ████░░░░░░ 32%
   @mizuno -0.8%  █░░░░░░░░░ 11%
   @kazuki +0.3%  ░░░░░░░░░░ —                 💪 今日から!

今日の一言(by Claude): 「joyさん7日連続すごい...!みんなリアクションで応援しよ」
```

Block Kitで実装。ActionsブロックでSlack内完結のリアクションボタンもあり。

## Slack App必要スコープ

- `chat:write`(投稿)
- `users:read`(ユーザー一覧)
- `users:read.email`(メールマッチ用・最重要)
- `channels:read`(チャンネル取得)
- (将来) `commands`(スラッシュコマンド追加する場合)

## 実装順序

1. **Supabaseプロジェクト作成、スキーマ確定**
   - 3テーブル + RLS + トリガー(上記DDL + トリガー関数)
   - DDLをマイグレーションファイルとして管理
2. **Cloudflare Workers + Honoプロジェクト初期化**
   - oRPCでAPI定義
   - Supabase JSクライアント組み込み(RLS前提、ユーザーJWTをそのまま使う)
3. **React Router v7フロント初期化**
   - Cloudflare Pagesデプロイ
   - Supabase Auth Google OAuth組み込み
4. **認証 + オンボーディングフロー**
   - 初回ログイン時にprofiles作成、Slack User IDをlookupByEmailで自動補完
5. **体重記録 + 自分のダッシュボード**
6. **みんなの進捗ボード画面**
7. **Workers Cronで日次Slack投稿**
8. **Claude APIで今日の一言生成**(Slack投稿に組み込む)
9. **(将来) MCPサーバ実装**

## 技術的注意点

- **絶対値の秘匿**: アプリコードでも「public側テーブルにweight_kgを書くコードパス」が存在しないよう徹底。トリガー経由のみに絞る
- **Supabase Auth + RLS**: WorkersからSupabaseを叩くときはユーザーのJWTをそのまま使って `auth.uid()` を効かせる。Service Roleキーを使うのは日次Cron等のバッチ処理のみに限定
- **タイムゾーン**: `logged_at` は `date` 型、JST基準で扱う。記録は1日1レコード(unique制約)
- **streak計算**: トリガー内で前日レコードの有無を見て増減。飛んだ日が1日あったらリセット
- **goal_weight < start_weight 前提**: 増量目的も将来対応するなら符号周りを再設計(初期はダイエット目的に限定でOK)

## 確認済み設計判断

- 認証はGoogle OAuth(Slack OAuthではない)、Slack連携はメールマッチで後付け
- 進捗は両方入れて「開始時点からの増減%」をメイン、「目標到達度%」をサブ
- 参加規模10人、Cloudflare + Supabase無料枠で完全無料想定
- MCPは後付け可能な構成だけ用意、初期実装しない

## 未決事項(Claude Code側で決めてOK)

- アプリ正式名称
- Slackチャンネル名
- 会社のGoogle Workspaceドメイン(環境変数化)
- デザインテイスト(フロントエンドスキル参照推奨)
- 日次Cronの時刻(9:00 JST想定だがチームに合わせて)
