import { os } from "@orpc/server";
import { z } from "zod";
import { toORPCError } from "~/core/exceptions/toORPCError";
import {
	OnboardingInputSchema,
	ProfileSchema,
	UpdateGoalsInputSchema,
} from "~/domain/schemas/profile";
import type { ORPCContext } from "~/router/context";
import { CompleteOnboardingUseCase } from "~/usecase/onboarding/completeOnboardingUseCase";
import { GetMyProfileUseCase } from "~/usecase/profile/getMyProfileUseCase";
import { UpdateGoalsUseCase } from "~/usecase/profile/updateGoalsUseCase";

const base = os.$context<ORPCContext>();

const me = base
	.route({ method: "GET", path: "/profile/me", tags: ["Profile"] })
	.output(ProfileSchema.nullable())
	.handler(async ({ context }) => {
		try {
			const useCase = new GetMyProfileUseCase(context.repos.profile);
			return await useCase.execute(context.user.id);
		} catch (err) {
			throw toORPCError(err);
		}
	});

const onboard = base
	.route({ method: "POST", path: "/profile/onboard", tags: ["Profile"] })
	.input(OnboardingInputSchema)
	.output(ProfileSchema)
	.handler(async ({ input, context }) => {
		try {
			const useCase = new CompleteOnboardingUseCase(context.repos.profile, context.services.slack);
			return await useCase.execute(context.user.id, context.user.email, input);
		} catch (err) {
			throw toORPCError(err);
		}
	});

const updateGoals = base
	.route({ method: "PATCH", path: "/profile/goals", tags: ["Profile"] })
	.input(UpdateGoalsInputSchema)
	.output(ProfileSchema)
	.handler(async ({ input, context }) => {
		try {
			const useCase = new UpdateGoalsUseCase(context.repos.profile);
			return await useCase.execute(context.user.id, input);
		} catch (err) {
			throw toORPCError(err);
		}
	});

export const profileRouter = { me, onboard, updateGoals };
