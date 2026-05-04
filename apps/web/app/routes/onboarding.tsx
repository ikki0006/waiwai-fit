import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { api } from "~/infrastructure/http/orpcClient";
import { useAuthStore } from "~/state/authStore";
import { Mascot } from "~/ui/components/mascot";
import { SpeechBubble } from "~/ui/components/speech-bubble";
import { Button } from "~/ui/components/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/components/shadcn/card";
import { Input } from "~/ui/components/shadcn/input";
import { Label } from "~/ui/components/shadcn/label";

export default function OnboardingPage() {
	const navigate = useNavigate();
	const user = useAuthStore((s) => s.user);
	const [startWeight, setStartWeight] = useState("");
	const [goalWeight, setGoalWeight] = useState("");

	const mutation = useMutation({
		mutationFn: async () => {
			if (!user) throw new Error("not authenticated");
			return api.profile.onboard({
				displayName: (user.user_metadata?.name as string) ?? user.email!,
				avatarUrl: (user.user_metadata?.picture as string) ?? null,
				startWeight: Number(startWeight),
				goalWeight: Number(goalWeight),
			});
		},
		onSuccess: () => navigate("/", { replace: true }),
	});

	const ready = !!startWeight && !!goalWeight;
	const mascotState = mutation.error
		? "error"
		: mutation.isPending
			? "searching"
			: ready
				? "suggesting"
				: "waiting";

	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-6">
			<div className="mb-4 flex items-end gap-3">
				<Mascot state={mascotState} bob size={88} />
				<SpeechBubble tail="left" className="mb-2">
					{mutation.error
						? "保存できなかったよ"
						: mutation.isPending
							? "登録中…"
							: ready
								? "いいね！その目標で行こう"
								: "目標を教えて！"}
				</SpeechBubble>
			</div>
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>はじめましょう</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="start">開始時の体重 (kg)</Label>
						<Input
							id="start"
							type="number"
							step="0.1"
							value={startWeight}
							onChange={(e) => setStartWeight(e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="goal">目標体重 (kg)</Label>
						<Input
							id="goal"
							type="number"
							step="0.1"
							value={goalWeight}
							onChange={(e) => setGoalWeight(e.target.value)}
						/>
					</div>
					<Button
						className="w-full"
						onClick={() => mutation.mutate()}
						disabled={!startWeight || !goalWeight || mutation.isPending}
					>
						{mutation.isPending ? "保存中…" : "スタート"}
					</Button>
					{mutation.error && (
						<p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
					)}
				</CardContent>
			</Card>
		</main>
	);
}
