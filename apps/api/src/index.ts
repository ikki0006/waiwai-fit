import { OpenAPIGenerator } from "@orpc/openapi";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodSmartCoercionPlugin, ZodToJsonSchemaConverter } from "@orpc/zod";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { authHandler } from "~/core/middleware/authHandler";
import { errorHandler } from "~/core/middleware/errorHandler";
import { loggingHandler } from "~/core/middleware/loggingHandler";
import { buildRequestRepos, buildServices } from "~/di/container";
import { createUserClient } from "~/infrastructure/supabase/userClient";
import { router } from "~/router";
import type { ORPCContext } from "~/router/context";
import { runDailyBoard } from "~/scheduled/dailyBoard";
import type { AuthUser, Env } from "~/types/env";

type AppBindings = {
	Bindings: Env;
	Variables: { user: AuthUser; jwt: string };
};

const app = new Hono<AppBindings>();

app.use("*", loggingHandler);
app.use("*", async (c, next) => {
	const allowed = c.env.CORS_ORIGINS?.split(",") ?? ["http://localhost:3001"];
	return cors({
		origin: (origin) => (allowed.includes(origin) ? origin : allowed[0]),
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
	})(c, next);
});
app.onError(errorHandler);

app.get("/", (c) => c.json({ result: "ok", service: "waiwai-fit-api" }));

// OpenAPI spec & Scalar docs (認証不要 / 開発向け)
const openApiGenerator = new OpenAPIGenerator({
	schemaConverters: [new ZodToJsonSchemaConverter()],
});

app.get("/openapi.json", async (c) => {
	const spec = await openApiGenerator.generate(router, {
		info: {
			title: "waiwai-fit API",
			version: "1.0.0",
			description:
				"社内ダイエットアプリのAPI。認証はSupabase Auth(Google OAuth)のJWTをBearerで渡す。",
		},
		servers: [{ url: new URL(c.req.url).origin }],
	});
	return c.json(spec);
});

app.get(
	"/docs",
	Scalar({
		url: "/openapi.json",
		pageTitle: "waiwai-fit API",
	}),
);

// 以降は認証必須
app.use("/api/*", authHandler);
app.use("/rpc/*", authHandler);

const openApiHandler = new OpenAPIHandler(router, {
	plugins: [new ZodSmartCoercionPlugin()],
});
const rpcHandler = new RPCHandler(router);

function buildContext(c: { env: Env; var: { user: AuthUser; jwt: string } }): ORPCContext {
	const sb = createUserClient(c.env, c.var.jwt);
	return {
		user: c.var.user,
		env: c.env,
		repos: buildRequestRepos(sb),
		services: buildServices(c.env),
	};
}

app.all("/api/*", async (c) => {
	const { matched, response } = await openApiHandler.handle(c.req.raw, {
		prefix: "/api",
		context: buildContext(c),
	});
	if (matched) return c.newResponse(response.body, response);
	return c.notFound();
});

app.all("/rpc/*", async (c) => {
	const { matched, response } = await rpcHandler.handle(c.req.raw, {
		prefix: "/rpc",
		context: buildContext(c),
	});
	if (matched) return c.newResponse(response.body, response);
	return c.notFound();
});

export default {
	fetch: app.fetch,
	async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
		ctx.waitUntil(runDailyBoard(env));
	},
};
