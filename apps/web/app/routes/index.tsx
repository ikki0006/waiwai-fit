import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Mascot } from "~/ui/components/mascot";
import { DashboardPage } from "~/ui/feature/dashboard/DashboardPage";
import { useDashboardData } from "~/ui/feature/dashboard/useDashboardData";

export default function DashboardRoute() {
	const navigate = useNavigate();
	const { initialized, session, profile, profileLoaded, history } = useDashboardData();

	useEffect(() => {
		if (initialized && !session) navigate("/login", { replace: true });
	}, [initialized, session, navigate]);

	useEffect(() => {
		if (profileLoaded && !profile) navigate("/onboarding", { replace: true });
	}, [profileLoaded, profile, navigate]);

	if (!initialized || !profile) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center gap-3">
				<Mascot state="searching" bob size={80} />
				<p className="text-muted-foreground">読み込み中…</p>
			</main>
		);
	}

	return <DashboardPage profile={profile} history={history} />;
}
