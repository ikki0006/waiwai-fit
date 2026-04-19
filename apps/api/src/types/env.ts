export type Env = {
	SUPABASE_URL: string;
	SUPABASE_ANON_KEY: string;
	SUPABASE_SERVICE_ROLE_KEY: string;
	SLACK_BOT_TOKEN: string;
	ANTHROPIC_API_KEY: string;
	CORS_ORIGINS: string;
	SLACK_CHANNEL_ID: string;
	GOOGLE_WORKSPACE_DOMAIN: string;
	/** カンマ区切りのallowlist。空なら全員許可(ローカル開発用) */
	ALLOWED_EMAILS: string;
};

export type AuthUser = {
	id: string;
	email: string;
};
