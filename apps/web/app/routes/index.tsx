import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "~/infrastructure/http/orpcClient";
import { useAuthStore } from "~/state/authStore";
import { Mascot, type MascotState } from "~/ui/components/mascot";
import { SpeechBubble } from "~/ui/components/speech-bubble";
import { StatusBadge, type StatusVariant } from "~/ui/components/status-badge";
import { Button } from "~/ui/components/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/components/shadcn/card";
import { Input } from "~/ui/components/shadcn/input";
import { Label } from "~/ui/components/shadcn/label";
import { Progress } from "~/ui/components/shadcn/progress";

export default function DashboardPage() {
	const navigate = useNavigate();
	const session = useAuthStore((s) => s.session);
	const initialized = useAuthStore((s) => s.initialized);
	const qc = useQueryClient();
	const [weight, setWeight] = useState("");

	useEffect(() => {
		if (initialized && !session) navigate("/login", { replace: true });
	}, [initialized, session, navigate]);

	const profileQuery = useQuery({
		queryKey: ["profile.me"],
		queryFn: () => api.profile.me({}),
		enabled: !!session,
	});

	useEffect(() => {
		if (profileQuery.isSuccess && !profileQuery.data) navigate("/onboarding", { replace: true });
	}, [profileQuery.isSuccess, profileQuery.data, navigate]);

	const historyQuery = useQuery({
		queryKey: ["weight.history"],
		queryFn: () => api.weight.myHistory({ limit: 30 }),
		enabled: !!profileQuery.data,
	});

	const recordMutation = useMutation({
		mutationFn: (w: number) => api.weight.log({ weightKg: w }),
		onSuccess: () => {
			setWeight("");
			qc.invalidateQueries({ queryKey: ["weight.history"] });
		},
	});

	const profile = profileQuery.data;
	const latest = historyQuery.data?.[0];

	const progressPct =
		profile && latest
			? ((latest.weightKg - profile.startWeight) / profile.startWeight) * 100
			: null;
	const goalPct =
		profile && latest
			? ((profile.startWeight - latest.weightKg) / (profile.startWeight - profile.goalWeight)) * 100
			: null;

	if (!initialized || !profile) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center gap-3">
				<Mascot state="searching" bob size={80} />
				<p className="text-muted-foreground">読み込み中…</p>
			</main>
		);
	}

	const hasRecord = !!latest;
	let mascotState: MascotState;
	let statusVariant: StatusVariant;
	let bubble: string;
	if (!hasRecord) {
		mascotState = "waiting";
		statusVariant = "waiting";
		bubble = "最初の記録を入れてみよう！";
	} else if ((goalPct ?? 0) >= 100) {
		mascotState = "complete";
		statusVariant = "match";
		bubble = "目標達成！おめでとう";
	} else if ((progressPct ?? 0) < 0) {
		mascotState = "suggesting";
		statusVariant = "checking";
		bubble = "順調！この調子だ";
	} else {
		mascotState = "default";
		statusVariant = "info";
		bubble = "今日もコツコツ行こう";
	}

	return (
		<main className="mx-auto max-w-md p-6 space-y-6">
			<header className="flex items-center justify-between">
				<h1 className="text-xl font-bold">{profile.displayName} さん</h1>
				<Link to="/board" className="text-sm text-muted-foreground underline">
					みんなのボード →
				</Link>
			</header>

			<div className="flex items-end gap-3">
				<Mascot state={mascotState} bob size={88} />
				<div className="flex-1 space-y-2">
					<StatusBadge variant={statusVariant} />
					<SpeechBubble tail="left">{bubble}</SpeechBubble>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>今の進捗</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="text-center">
						<div className="text-5xl font-bold tabular-nums">
							{progressPct !== null ? (
								<span className={progressPct < 0 ? "text-green-600" : "text-rose-600"}>
									{progressPct > 0 ? "+" : ""}
									{progressPct.toFixed(1)}%
								</span>
							) : (
								<span className="text-muted-foreground">—</span>
							)}
						</div>
						<div className="mt-1 text-xs text-muted-foreground">開始時点からの増減</div>
					</div>
					<div>
						<div className="flex justify-between text-xs text-muted-foreground mb-1">
							<span>目標到達度</span>
							<span>{goalPct !== null ? `${Math.round(goalPct)}%` : "—"}</span>
						</div>
						<Progress value={Math.max(0, Math.min(100, goalPct ?? 0))} />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>今日の体重を記録</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="space-y-1.5">
						<Label htmlFor="w">体重 (kg)</Label>
						<Input
							id="w"
							type="number"
							step="0.1"
							value={weight}
							onChange={(e) => setWeight(e.target.value)}
						/>
					</div>
					<Button
						className="w-full"
						onClick={() => recordMutation.mutate(Number(weight))}
						disabled={!weight || recordMutation.isPending}
					>
						{recordMutation.isPending ? "保存中…" : "記録する"}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>最近の記録</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="space-y-1 text-sm">
						{historyQuery.data?.slice(0, 10).map((log) => (
							<li key={log.id} className="flex justify-between">
								<span className="text-muted-foreground">{log.loggedAt}</span>
								<span className="tabular-nums">{log.weightKg.toFixed(1)} kg</span>
							</li>
						))}
					</ul>
				</CardContent>
			</Card>

			<div className="text-center">
				<Link to="/settings" className="text-sm text-muted-foreground underline">
					設定
				</Link>
			</div>
		</main>
	);
}
