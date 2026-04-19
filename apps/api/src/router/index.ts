import { boardRouter } from "./board";
import { mcpRouter } from "./mcp";
import { profileRouter } from "./profile";
import { weightRouter } from "./weight";

export const router = {
	profile: profileRouter,
	weight: weightRouter,
	board: boardRouter,
	mcp: mcpRouter,
};

export type Router = typeof router;
