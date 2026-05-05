import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getSupabase } from "~/infrastructure/supabase/client";
import { useAuthStore } from "~/state/authStore";
import { MascotMessage } from "~/ui/components/mascot-message";
import { Button } from "~/ui/components/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/ui/components/shadcn/card";

export function LoginPage() {
	const navigate = useNavigate();
	const session = useAuthStore((s) => s.session);
	const initialized = useAuthStore((s) => s.initialized);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (initialized && session) navigate("/", { replace: true });
	}, [initialized, session, navigate]);

	async function signIn() {
		setError(null);
		setLoading(true);
		const domain = import.meta.env.VITE_GOOGLE_WORKSPACE_DOMAIN;
		const { error } = await getSupabase().auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
				scopes: "openid email profile",
				queryParams: domain ? { hd: domain } : undefined,
			},
		});
		if (error) {
			setError(error.message);
			setLoading(false);
		}
	}

	const mascotState = error ? "error" : loading ? "searching" : "waiting";

	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-6">
			<MascotMessage
				state={mascotState}
				message={error ? "もう一度試してね" : loading ? "確認中…" : "ログインしてね！"}
				className="mb-4"
			/>
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle className="text-2xl">▶ WAIWAI-FIT</CardTitle>
					<CardDescription>社内でワイワイやるダイエットアプリ</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{error && <p className="text-sm text-destructive">! {error}</p>}
						<Button className="w-full" onClick={signIn} disabled={loading}>
							{loading ? "..." : "Googleでログイン ▶"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</main>
	);
}
