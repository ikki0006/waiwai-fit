import type { RequestRepos, Services } from "~/di/container";
import type { AuthUser, Env } from "~/types/env";

export type ORPCContext = {
	user: AuthUser;
	env: Env;
	repos: RequestRepos;
	services: Services;
};
