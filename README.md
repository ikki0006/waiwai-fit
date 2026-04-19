# waiwai-fit

社内10人規模で使う、ワイワイできるダイエットアプリ。
体重の絶対値は本人だけ、他人には相対値(%)だけ見えるようにして心理的ハードルを下げつつ、Slackで煽り合える。

## 設計思想

### 1. 「秘匿」と「ワイワイ」の両立

ダイエットアプリの最大の心理的ハードルは「体重の絶対値を他人に見られること」。一方で、
ひとりで黙々とやっても続かない。この2つを両立するために、**情報の可視性を2層に分離**する。

- **本人だけが見える層**: 体重の絶対値(kg)、自分の推移グラフ
- **全員が見える層**: 相対値(%)、目標到達度、streak、アバター、名前

この分離は「頑張ります」ではなく **DBとRLSで型レベルに強制** する。アプリコードから
相対値側テーブルに体重kgを書き込むパスが存在しない構造にして、ヒューマンエラーで漏れる
可能性をゼロにする。具体的には:

- `weight_logs`(絶対値): 本人のみ read/write、RLSで `auth.uid() = user_id`
- `progress_public`(相対値): 全員 read、本人のみ write、**DBトリガー経由でしか書かれない**
- アプリ層のリポジトリは `WeightLogRepository` と `ProgressPublicRepository` を分離、
  後者には `weight_kg` を受け取るメソッドを**一切生やさない**

### 2. メイン指標は「開始時点からの増減%」

「目標到達度」は真面目すぎて、ダイエットの進捗共有としてはドラマが出にくい。
代わりに **開始時点からの増減%** をメイン指標(デカ文字)にして、サブ指標として
目標到達度をプログレスバーで添える。

- `progress_from_start_pct = (current - start) / start * 100` (減量側はマイナス)
- `goal_achievement_pct = (start - current) / (start - goal) * 100` (0〜100+)

減った人は「-4.2%」みたいに見えるので変化が分かりやすく、Slackでのリアクションが
起きやすい。

### 3. エッジ + マネージドで「ほぼ0円」

10人・プライベート運用なので、月額は数百円以内に抑えたい。

- **API**: Cloudflare Workers(無料枠: 10万req/day)
- **フロント**: Cloudflare Pages(無料枠で十分)
- **DB + Auth**: Supabase 無料枠(500MB、RLS使える、Google OAuthプロバイダ標準装備)
- **AI**: Anthropic API 従量課金(週次サマリだけなら月0〜300円想定、prompt cachingで更に削る)
- **Slack**: Bot Token発行のみ、無料

常駐サーバを持たず、バッチ処理もWorkers Cronに寄せる。

### 4. Supabase Auth + RLSを素直に使う

認証まわりを自前実装しない。**Supabase Auth標準のGoogle OAuth** を使って、JWT発行・リフレッシュ・
セッション永続化は全部Supabaseに任せる。

WorkersからSupabaseを叩くときは **ユーザーのJWTをそのまま転送** して、`auth.uid()` を
RLSポリシーで効かせる。Service Role Keyを使うのは **日次Cronのバッチ処理だけ** に厳格に
限定し、アプリコードパスでは一切使わない。

**ユーザー制限** は2階建て:

- **GCP側**: OAuth同意画面を「外部・テスト」で作り、テストユーザーにメアド登録(Workspaceなら
  `hd` パラメータで絞れるが、個人GCPなら「テストユーザー」機能で代替)
- **サーバ側**: `ALLOWED_EMAILS` 環境変数(カンマ区切り)で allowlist を管理、
  `authHandler` で JWT 検証後にメールが入っていなければ 403。
  クライアント側の `hd` は信用しきれないので、サーバ側の二重チェックを必須にする

### 5. Slack連携は「メールマッチで後付け」

認証はGoogle OAuth、Slack OAuthは使わない。ログイン後に Slack API `users.lookupByEmail`
でメールアドレスから `slack_user_id` を引いて `profiles.slack_user_id` に保存する。
これでSlack側の認証フローを通さずに、日次ボード投稿で `<@U12345>` メンションが打てる。

## アーキ構成

### 技術スタック

| レイヤー | 技術 |
|---|---|
| フロント | React Router v7 (SPA, `ssr: false`) + Tailwind CSS v4 + shadcn/ui |
| API | Cloudflare Workers + Hono + oRPC |
| DB + Auth | Supabase (Postgres + RLS + Google OAuth) |
| バッチ | Cloudflare Workers Cron Triggers |
| AI | Anthropic API (Claude Opus 4.7, prompt caching) |
| Slack | Slack Web API (Bot Token) |
| 状態管理 | Zustand (クライアント) |
| 型検証 | Zod |
| Lint/Format | Biome |
| パッケージ管理 | pnpm workspace |

### ディレクトリ構成

```
waiwai-fit/
├─ apps/
│  ├─ api/                         # Cloudflare Workers (Hono + oRPC)
│  │  ├─ src/
│  │  │  ├─ index.ts               # fetch + scheduled(Cron) エントリ
│  │  │  ├─ core/
│  │  │  │  ├─ middleware/         # authHandler, errorHandler, loggingHandler
│  │  │  │  └─ exceptions/
│  │  │  ├─ di/                    # DIコンテナ(JWT非依存の依存だけ登録)
│  │  │  ├─ domain/
│  │  │  │  ├─ repositories/       # インターフェース定義
│  │  │  │  ├─ services/           # SlackService, ClaudeService インターフェース
│  │  │  │  └─ schemas/            # Zodスキーマと型
│  │  │  ├─ usecase/               # ユースケース層 (onboarding/weight/board/slack)
│  │  │  ├─ infrastructure/
│  │  │  │  ├─ supabase/           # createUserClient(jwt) / createServiceClient(env)
│  │  │  │  ├─ repositories/       # Repository実装
│  │  │  │  ├─ slack/              # Slack Web API クライアント
│  │  │  │  └─ claude/             # Anthropic API クライアント
│  │  │  ├─ router/                # oRPC ルーター (profile/weight/board/mcp)
│  │  │  ├─ scheduled/             # Cronエントリ (dailyBoard.ts)
│  │  │  └─ rpc/                   # クライアント向け型エクスポート
│  │  ├─ supabase/
│  │  │  ├─ migrations/            # DDL + RLS + トリガー関数
│  │  │  └─ config.toml
│  │  ├─ wrangler.toml
│  │  └─ package.json
│  │
│  └─ web/                         # Cloudflare Pages (React Router v7 SPA)
│     ├─ app/
│     │  ├─ root.tsx
│     │  ├─ routes.ts
│     │  ├─ routes/                # login, auth.callback, onboarding, index, board, settings
│     │  ├─ domain/types/          # oRPC契約から引いた型
│     │  ├─ infrastructure/
│     │  │  ├─ supabase/           # browser client
│     │  │  └─ http/               # oRPC client (JWTを Authorization ヘッダに載せる)
│     │  ├─ state/                 # zustand (authStore)
│     │  ├─ lib/                   # cn() など
│     │  └─ ui/
│     │     ├─ components/
│     │     │  ├─ shadcn/          # shadcn CLIが生成する部品(Button, Card, Progress...)
│     │     │  └─ *.tsx            # 自作コンポーネント (WeightForm, BoardRow, ...)
│     │     └─ hooks/
│     ├─ components.json           # shadcn設定
│     ├─ react-router.config.ts
│     ├─ vite.config.ts
│     └─ package.json
│
├─ biome.json
├─ tsconfig.base.json
├─ pnpm-workspace.yaml
├─ package.json
└─ CLAUDE.md                       # プロジェクト要件定義
```

### レイヤー分割の原則

DDD風の4層構成。依存方向は `router → usecase → domain ← infrastructure`。

- **domain**: インターフェースとZodスキーマだけ。外部依存ゼロ。
- **usecase**: ビジネスロジック。repository/service のインターフェースに依存。
- **infrastructure**: Supabase / Slack / Anthropic 等の具象実装。
- **router**: oRPCエンドポイント定義、入出力のZod契約、ユースケースの起動。

## データモデル

3テーブル構成。マイグレーション実体は [apps/api/supabase/migrations/](./apps/api/supabase/migrations/)。

### テーブル一覧

| テーブル | 書き込み主体 | 他人に見える? | 役割 |
|---|---|---|---|
| `profiles` | 本人のみ | 見えない | ユーザー設定(開始・目標体重、表示名、Slack ID) |
| `weight_logs` | 本人のみ | 見えない(絶対値の聖域) | 日次の体重kg生値 |
| `progress_public` | **DBトリガーのみ** | 全員に見える | 相対値(%)・streak・アバター・表示名 |

### 1. `profiles` — 本人だけが見える設定

```sql
create table profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  email         text    not null,
  display_name  text    not null,   -- Googleのname
  avatar_url    text,               -- Googleのpicture
  slack_user_id text,               -- users.lookupByEmailで自動補完
  start_weight  numeric not null check (start_weight > 0),
  goal_weight   numeric not null check (goal_weight > 0),
  started_at    date    not null default current_date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint goal_lt_start check (goal_weight < start_weight)
);
```

- **RLS**: `auth.uid() = user_id` で全操作許可。他人のprofilesは一切読めない
- **CHECK制約**: `goal_weight < start_weight` をDBレベルで強制(ダイエット専用前提)
- `updated_at` はトリガーで自動更新

### 2. `weight_logs` — 絶対値の聖域

```sql
create table weight_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  logged_at  date not null default current_date,
  weight_kg  numeric not null check (weight_kg > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, logged_at)
);
```

- **RLS**: `auth.uid() = user_id` で全操作許可。**他人は絶対に読めない**
- `unique (user_id, logged_at)`: 1日1レコード。過去日の訂正時は既存レコードを UPDATE
- `created_at` は初回INSERT時刻を保持、`updated_at` は INSERT/UPDATE 両方で `now()` に更新(トリガー経由)
- Repository 実装では `upsert` ではなく「存在すれば UPDATE、無ければ INSERT」で `created_at` を維持する
- INSERT/UPDATE で `progress_public` へのトリガーが発火

### 3. `progress_public` — 全員が見える相対値

```sql
create table progress_public (
  user_id                 uuid not null references auth.users(id) on delete cascade,
  display_name            text not null,
  avatar_url              text,
  slack_user_id           text,
  logged_at               date not null,
  progress_from_start_pct numeric not null,  -- メイン: 開始時点からの増減% (減はマイナス)
  goal_achievement_pct    numeric not null,  -- サブ: 目標到達度% (0〜100+)
  weekly_delta_pct        numeric,           -- 7日前比(7日前の記録が無ければnull)
  streak_days             int not null default 0,
  updated_at              timestamptz not null default now(),
  primary key (user_id, logged_at)
);
```

- **RLS**: select は認証済み全員、insert/update/delete は本人のみ
- ただし RLS で書き込み許可されていても、**アプリコードからは一切書かない**。
  - リポジトリインターフェース `ProgressPublicRepository` に write メソッドを生やさない
  - これで `weight_kg` の絶対値がアプリ経由で公開テーブルに漏れる経路を潰す
- 書き込みは **`weight_logs` のトリガー経由のみ**

### トリガーの動き

```
weight_logs に INSERT/UPDATE
  ↓ trg_weight_logs_upsert_progress
profilesから start_weight, goal_weight, display_name, avatar_url, slack_user_id を引く
  ↓
progress_from_start_pct = (weight_kg - start_weight) / start_weight * 100
goal_achievement_pct    = (start_weight - weight_kg) / (start_weight - goal_weight) * 100
weekly_delta_pct        = 7日前logがあれば (今日 - 7日前) / 7日前 * 100、無ければnull
streak_days             = 前日の progress_public があれば +1、無ければ 1
  ↓ UPSERT (on conflict: user_id, logged_at)
progress_public
```

補助トリガー:

- `trg_profiles_sync_progress`: `profiles` の `display_name` / `avatar_url` / `slack_user_id` が
  変わったら `progress_public` の既存レコードに反映(Slack投稿で古い名前が出ないように)
- `trg_profiles_touch_updated_at`: `profiles` 更新時に `updated_at` を自動更新

### 指標の定義(確定仕様)

- **`progress_from_start_pct`**(メイン・デカ表示):
  - `(current_weight - start_weight) / start_weight * 100`
  - 減量できていればマイナス値(例: `-4.2%`)
  - ダッシュボードで大きく表示、Slackボードでランキングの基準
- **`goal_achievement_pct`**(サブ・小さく表示):
  - `(start_weight - current_weight) / (start_weight - goal_weight) * 100`
  - 0%スタート、100%で目標達成
  - プログレスバーで表示
- **`weekly_delta_pct`**: 7日前比。体重は日次だと水分変動で揺れるので、中期トレンドの煽り素材として週次を採用。7日前の記録が無ければ `null`
- **`streak_days`**: 連続記録日数、1日空いたら1にリセット

## データフロー

### 体重記録時
```
ユーザー入力 (kg)
  ↓ POST /weight/log (JWT付き)
Workers: authHandler でJWT検証
  ↓
useCase: weight_logs へ INSERT
  ↓ (DBトリガー自動起動)
Postgres trigger:
  - profilesから start_weight / goal_weight / display_name / avatar_url / slack_user_id 引く
  - 相対値・goal達成率・週比・streakを計算
  ↓ UPSERT
progress_public
```

**アプリコードは一切 `progress_public` に書かない**。これが秘匿の肝。

### 日次Slack投稿 (Workers Cron 09:00 JST)
```
Cron trigger
  ↓
scheduled/dailyBoard.ts
  ↓ (Service Role で読む)
progress_public から今日分を全員取得
  ↓
ClaudeService.generateDailyComment(board) -- prompt caching 効かせる
  ↓
SlackService.postMessage(channel, blockKit) -- #diet-waiwai
```

## 画面構成

| パス | 用途 |
|---|---|
| `/login` | Googleログイン |
| `/auth/callback` | Supabase OAuth コールバック |
| `/onboarding` | 初回のみ、start_weight / goal_weight を入力 |
| `/` | 自分のダッシュボード(記録フォーム、グラフ、メイン指標デカ表示、サブプログレスバー) |
| `/board` | みんなの進捗ボード(相対値のみ、ランキング) |
| `/settings` | 目標値の変更、Slack連携確認 |

## 実装順序

1. Supabaseプロジェクト作成、3テーブル + RLS + トリガー(マイグレーションで管理)
2. `apps/api` 初期化(Workers + Hono + oRPC + authHandler)、`/profile/me` だけ疎通
3. `apps/web` 初期化(RR v7 + Tailwind + shadcn/ui + Supabase browser client)、`/login` 〜 `/onboarding` 導線
4. 初回ログイン時のprofiles作成 + Slack `users.lookupByEmail` で `slack_user_id` 自動補完
5. 体重記録 + 自分のダッシュボード(メイン指標デカ + サブプログレスバー)
6. みんなの進捗ボード画面(相対値表示)
7. Workers Cronで日次Slack投稿(Block Kit)
8. Claude API で今日の一言生成、Slack投稿に組み込み
9. (将来) MCPサーバ実装

## 技術的注意点

- **絶対値の秘匿**: `progress_public` に `weight_kg` を書くコードパスが存在しないよう、
  リポジトリ層の型で弾く。レビュー時も要チェック。
- **Service Role Key の使用範囲**: `scheduled/` 以下のCronバッチのみ。リクエスト経路
  では絶対に使わない(RLSが効かなくなるため)。
- **タイムゾーン**: `logged_at` は `date` 型、JST基準。記録は1日1レコード(unique制約)。
- **streak計算**: トリガー内で前日レコードの有無を見て増減。1日空いたらリセット。
- **goal_weight < start_weight 前提**: 初期はダイエット目的に限定。増量対応は符号周りの
  再設計が必要。

## 未決事項(Claude Code側で決めてOK)

- アプリ正式名称(仮: waiwai-fit)
- Slackチャンネル名(仮: `#diet-waiwai`)
- 会社のGoogle Workspaceドメイン(環境変数化)
- 日次Cronの時刻(9:00 JST想定)
