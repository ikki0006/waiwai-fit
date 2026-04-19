import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
	route("", "routes/index.tsx"),
	route("login", "routes/login.tsx"),
	route("auth/callback", "routes/auth.callback.tsx"),
	route("onboarding", "routes/onboarding.tsx"),
	route("board", "routes/board.tsx"),
	route("settings", "routes/settings.tsx"),
] satisfies RouteConfig;
