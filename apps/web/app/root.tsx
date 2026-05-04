import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "./app.css";

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="ja">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>waiwai-fit</title>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link
					rel="stylesheet"
					href="https://fonts.googleapis.com/css2?family=DotGothic16&family=Press+Start+2P&display=swap"
				/>
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	const [client] = useState(() => new QueryClient());
	useEffect(() => {
		// authStoreの初期化はクライアントマウント後
		import("~/state/authStore").then(({ useAuthStore }) => useAuthStore.getState().init());
	}, []);
	return (
		<QueryClientProvider client={client}>
			<Outlet />
		</QueryClientProvider>
	);
}

export function ErrorBoundary() {
	return (
		<div className="flex min-h-screen items-center justify-center p-6">
			<div className="text-center">
				<h1 className="text-2xl font-bold">エラーが発生しました</h1>
				<p className="mt-2 text-muted-foreground">ページを再読み込みしてください。</p>
			</div>
		</div>
	);
}
