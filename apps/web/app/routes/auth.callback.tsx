import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "~/state/authStore";

export default function AuthCallbackPage() {
	const navigate = useNavigate();
	const initialized = useAuthStore((s) => s.initialized);
	const session = useAuthStore((s) => s.session);

	useEffect(() => {
		if (!initialized) return;
		navigate(session ? "/" : "/login", { replace: true });
	}, [initialized, session, navigate]);

	return (
		<main className="flex min-h-screen items-center justify-center">
			<p className="text-muted-foreground">ログイン中…</p>
		</main>
	);
}
