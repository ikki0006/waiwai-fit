import { os } from "@orpc/server";
import { z } from "zod";
import { toORPCError } from "~/core/exceptions/toORPCError";
import { ProgressPublicSchema } from "~/domain/schemas/progress";
import type { ORPCContext } from "~/router/context";
import { GetBoardHistoryUseCase } from "~/usecase/board/getBoardHistoryUseCase";
import { GetBoardUseCase } from "~/usecase/board/getBoardUseCase";

const base = os.$context<ORPCContext>();

const today = base
	.route({ method: "GET", path: "/board/today", tags: ["Board"] })
	.input(z.object({ date: z.string().optional() }))
	.output(z.array(ProgressPublicSchema))
	.handler(async ({ input, context }) => {
		try {
			const useCase = new GetBoardUseCase(context.repos.progressPublic);
			return await useCase.execute(input.date);
		} catch (err) {
			throw toORPCError(err);
		}
	});

const history = base
	.route({ method: "GET", path: "/board/history", tags: ["Board"] })
	.input(z.object({ days: z.number().int().positive().max(365) }))
	.output(z.array(ProgressPublicSchema))
	.handler(async ({ input, context }) => {
		try {
			const useCase = new GetBoardHistoryUseCase(context.repos.progressPublic);
			return await useCase.execute(input.days);
		} catch (err) {
			throw toORPCError(err);
		}
	});

export const boardRouter = { today, history };
