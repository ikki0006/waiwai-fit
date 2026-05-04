import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getSupabase } from "~/infrastructure/supabase/client";
import { useAuthStore } from "~/state/authStore";
import { Button } from "~/ui/components/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/ui/components/shadcn/card";
import { Input } from "~/ui/components/shadcn/input";

export default function LoginPage() {
	const navigate = useNavigate();
	const session = useAuthStore((s) => s.session);
	const initialized = useAuthStore((s) => s.initialized);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (initialized && session) navigate("/", { replace: true });
	}, [initialized, session, navigate]);

	async function signIn(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		const { error } = await getSupabase().auth.signInWithPassword({ email, password });
		setLoading(false);
		if (error) {
			setError(error.message);
			return;
		}
		navigate("/", { replace: true });
	}

	return (
		<main className="flex min-h-screen items-center justify-center p-6">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle className="text-2xl">▶ WAIWAI-FIT</CardTitle>
					<CardDescription>社内でワイワイやるダイエットアプリ</CardDescription>
				</CardHeader>
				<CardContent>
					<form className="space-y-4" onSubmit={signIn}>
						<div className="space-y-1">
							<label className="text-xs uppercase tracking-widest" htmlFor="email">
								Email
							</label>
							<Input
								id="email"
								type="email"
								required
								placeholder="trainer@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>
						<div className="space-y-1">
							<label className="text-xs uppercase tracking-widest" htmlFor="password">
								Password
							</label>
							<Input
								id="password"
								type="password"
								required
								placeholder="********"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
						{error && <p className="text-sm text-destructive">! {error}</p>}
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "..." : "ログイン ▶"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</main>
	);
}
