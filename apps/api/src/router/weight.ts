import { os } from "@orpc/server";
import { z } from "zod";
import { toORPCError } from "~/core/exceptions/toORPCError";
import { RecordWeightInputSchema, WeightLogSchema } from "~/domain/schemas/weightLog";
import type { ORPCContext } from "~/router/context";
import { GetMyHistoryUseCase } from "~/usecase/weight/getMyHistoryUseCase";
import { RecordWeightUseCase } from "~/usecase/weight/recordWeightUseCase";

const base = os.$context<ORPCContext>();

const log = base
	.route({ method: "POST", path: "/weight/log", tags: ["Weight"] })
	.input(RecordWeightInputSchema)
	.output(WeightLogSchema)
	.handler(async ({ input, context }) => {
		try {
			const useCase = new RecordWeightUseCase(context.repos.weightLog);
			return await useCase.execute(context.user.id, input.weightKg, input.loggedAt);
		} catch (err) {
			throw toORPCError(err);
		}
	});

const myHistory = base
	.route({ method: "GET", path: "/weight/my-history", tags: ["Weight"] })
	.input(z.object({ limit: z.number().int().positive().max(365).optional() }))
	.output(z.array(WeightLogSchema))
	.handler(async ({ input, context }) => {
		try {
			const useCase = new GetMyHistoryUseCase(context.repos.weightLog);
			return await useCase.execute(context.user.id, input.limit ?? 90);
		} catch (err) {
			throw toORPCError(err);
		}
	});

export const weightRouter = { log, myHistory };
