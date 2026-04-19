import { os } from "@orpc/server";
import { z } from "zod";
import { toORPCError } from "~/core/exceptions/toORPCError";
import { ProgressPublicSchema } from "~/domain/schemas/progress";
import type { ORPCContext } from "~/router/context";
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

export const boardRouter = { today };
