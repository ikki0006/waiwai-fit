import { useEffect } from "react";
import { useNavigate } from "react-router";
import { getSupabase } from "~/infrastructure/supabase/client";
import { useAuthStore } from "~/state/authStore";
import { Button } from "~/ui/components/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/ui/components/shadcn/card";

export default function LoginPage() {
	const navigate = useNavigate();
	const session = useAuthStore((s) => s.session);
	const initialized = useAuthStore((s) => s.initialized);

	useEffect(() => {
		if (initialized && session) navigate("/", { replace: true });
	}, [initialized, session, navigate]);

	async function signIn() {
		const domain = import.meta.env.VITE_GOOGLE_WORKSPACE_DOMAIN;
		await getSupabase().auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
				scopes: "openid email profile",
				queryParams: domain ? { hd: domain } : undefined,
			},
		});
	}

	return (
		<main className="flex min-h-screen items-center justify-center p-6">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle className="text-2xl">waiwai-fit</CardTitle>
					<CardDescription>社内でワイワイやるダイエットアプリ</CardDescription>
				</CardHeader>
				<CardContent>
					<Button className="w-full" onClick={signIn}>
						Googleでログイン
					</Button>
				</CardContent>
			</Card>
		</main>
	);
}
