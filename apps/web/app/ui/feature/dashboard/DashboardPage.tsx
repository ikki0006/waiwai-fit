import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
import { api } from "~/infrastructure/http/orpcClient";
import { fieldErrorOf, toMutationError } from "~/lib/mutationError";
import type { MascotState } from "~/ui/components/mascot";
import { MascotMessage } from "~/ui/components/mascot-message";
import { Button } from "~/ui/components/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/components/shadcn/card";
import { Input } from "~/ui/components/shadcn/input";
import { Label } from "~/ui/components/shadcn/label";
import { Progress } from "~/ui/components/shadcn/progress";

type Profile = NonNullable<Awaited<ReturnType<typeof api.profile.me>>>;
type WeightLog = Awaited<ReturnType<typeof api.weight.myHistory>>[number];

interface DashboardPageProps {
	profile: Profile;
	history: WeightLog[];
}

function todayInJst(): string {
	const fmt = new Intl.DateTimeFormat("sv-SE", {
		timeZone: "Asia/Tokyo",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
	return fmt.format(new Date());
}

export function DashboardPage({ profile, history }: DashboardPageProps) {
	const qc = useQueryClient();
	const [weight, setWeight] = useState("");
	const [loggedAt, setLoggedAt] = useState(todayInJst);

	const recordMutation = useMutation({
		mutationFn: (input: { weightKg: number; loggedAt: string }) => api.weight.log(input),
		onSuccess: () => {
			setWeight("");
			setLoggedAt(todayInJst());
			qc.invalidateQueries({ queryKey: ["weight.history"] });
		},
	});

	const recordError = recordMutation.error ? toMutationError(recordMutation.error) : null;
	const weightFieldError = fieldErrorOf(recordError, "weightKg");
	const loggedAtFieldError = fieldErrorOf(recordError, "loggedAt");

	const latest = history[0];

	const progressPct = latest
		? ((latest.weightKg - profile.startWeight) / profile.startWeight) * 100
		: null;
	const goalPct = latest
		? ((profile.startWeight - latest.weightKg) / (profile.startWeight - profile.goalWeight)) * 100
		: null;

	const hasRecord = !!latest;
	let mascotState: MascotState;
	let bubble: string;
	if (!hasRecord) {
		mascotState = "waiting";
		bubble = "最初の記録を入れてみよう！";
	} else if ((goalPct ?? 0) >= 100) {
		mascotState = "complete";
		bubble = "目標達成！おめでとう";
	} else if ((progressPct ?? 0) < 0) {
		mascotState = "suggesting";
		bubble = "順調！この調子だ";
	} else {
		mascotState = "default";
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

			<MascotMessage state={mascotState} message={bubble} />

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
					<CardTitle>体重を記録</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="space-y-1.5">
						<Label htmlFor="logged-at">日付</Label>
						<Input
							id="logged-at"
							type="date"
							max={todayInJst()}
							value={loggedAt}
							onChange={(e) => setLoggedAt(e.target.value)}
						/>
						{loggedAtFieldError && <p className="text-xs text-destructive">{loggedAtFieldError}</p>}
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="w">体重 (kg)</Label>
						<Input
							id="w"
							type="number"
							step="0.1"
							value={weight}
							onChange={(e) => setWeight(e.target.value)}
						/>
						{weightFieldError && <p className="text-xs text-destructive">{weightFieldError}</p>}
					</div>
					<Button
						className="w-full"
						onClick={() => recordMutation.mutate({ weightKg: Number(weight), loggedAt })}
						disabled={!weight || !loggedAt || recordMutation.isPending}
					>
						{recordMutation.isPending ? "保存中…" : "記録する"}
					</Button>
					{recordError?.type === "form" && (
						<p className="text-sm text-destructive">! {recordError.message}</p>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>最近の記録</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="space-y-1 text-sm">
						{history.slice(0, 10).map((log) => (
							<li key={log.id} className="flex justify-between">
								<span className="text-muted-foreground">{log.loggedAt}</span>
								<span className="tabular-nums">{log.weightKg.toFixed(1)} kg</span>
							</li>
						))}
					</ul>
				</CardContent>
			</Card>

			<Button asChild variant="outline" className="w-full">
				<Link to="/settings">⚙ 設定</Link>
			</Button>
		</main>
	);
}
