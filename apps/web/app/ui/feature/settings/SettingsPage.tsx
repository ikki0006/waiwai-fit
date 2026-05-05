import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "~/infrastructure/http/orpcClient";
import { fieldErrorOf, toMutationError } from "~/lib/mutationError";
import { useAuthStore } from "~/state/authStore";
import { Button } from "~/ui/components/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/components/shadcn/card";
import { Input } from "~/ui/components/shadcn/input";
import { Label } from "~/ui/components/shadcn/label";

type Profile = NonNullable<Awaited<ReturnType<typeof api.profile.me>>>;

interface SettingsPageProps {
	profile: Profile | null;
}

export function SettingsPage({ profile }: SettingsPageProps) {
	const navigate = useNavigate();
	const qc = useQueryClient();
	const signOut = useAuthStore((s) => s.signOut);

	const [start, setStart] = useState("");
	const [goal, setGoal] = useState("");

	useEffect(() => {
		if (profile) {
			setStart(String(profile.startWeight));
			setGoal(String(profile.goalWeight));
		}
	}, [profile]);

	const update = useMutation({
		mutationFn: () =>
			api.profile.updateGoals({
				startWeight: Number(start),
				goalWeight: Number(goal),
			}),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["profile.me"] }),
	});

	const updateError = update.error ? toMutationError(update.error) : null;
	const startError = fieldErrorOf(updateError, "startWeight");
	const goalError = fieldErrorOf(updateError, "goalWeight");

	return (
		<main className="mx-auto max-w-md p-6 space-y-6">
			<header className="flex items-center justify-between">
				<h1 className="text-xl font-bold">設定</h1>
				<Link to="/" className="text-sm text-muted-foreground underline">
					← 戻る
				</Link>
			</header>

			<Card>
				<CardHeader>
					<CardTitle>目標</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="space-y-1.5">
						<Label htmlFor="s">開始時の体重 (kg)</Label>
						<Input
							id="s"
							type="number"
							step="0.1"
							value={start}
							onChange={(e) => setStart(e.target.value)}
						/>
						{startError && <p className="text-xs text-destructive">{startError}</p>}
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="g">目標体重 (kg)</Label>
						<Input
							id="g"
							type="number"
							step="0.1"
							value={goal}
							onChange={(e) => setGoal(e.target.value)}
						/>
						{goalError && <p className="text-xs text-destructive">{goalError}</p>}
					</div>
					<Button className="w-full" onClick={() => update.mutate()} disabled={update.isPending}>
						{update.isPending ? "保存中…" : "保存"}
					</Button>
					{updateError?.type === "form" && (
						<p className="text-sm text-destructive">! {updateError.message}</p>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Slack連携</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-sm">
						<span className="text-muted-foreground">Slack User ID: </span>
						<span className="tabular-nums">{profile?.slackUserId ?? "未連携"}</span>
					</div>
					<p className="mt-2 text-xs text-muted-foreground">
						メールアドレス一致で自動連携されます。未連携の場合、Slackの登録メールが会社アドレスか確認してください。
					</p>
				</CardContent>
			</Card>

			<Button
				variant="outline"
				className="w-full"
				onClick={async () => {
					await signOut();
					navigate("/login", { replace: true });
				}}
			>
				ログアウト
			</Button>
		</main>
	);
}
