import {
    basicErrorSchema, zodErrorSchema
} from '@webdev-project/api-client';
import {z} from "zod";

export const queryKeys = {
  LIST_TOURNAMENTS: { queryKey: ["list-tournaments"] },
  LIST_TOURNAMENT: (id: string) => ({ queryKey: [`list-tournament-${id}`] }),
  LIST_PARTICIPANTS: (id: string) => ({ queryKey: [`list-participants-${id}`] }),
};


export default function formatApiError(apiError: z.infer<typeof zodErrorSchema>) {
  return apiError
    .error
    .issues
    .reduce((all, issue) => `${all + issue.path.join(".")}: ${issue.message}\n`, "");
}

export function parseError(response: unknown) { 
    const parsed = zodErrorSchema.safeParse(response)
    if (parsed.success){
        const message = formatApiError(parsed.data);
        throw new Error(message);
    }

    const parsed1 = basicErrorSchema.safeParse(response)
    if (parsed1.success){
        throw new Error(parsed1.data.error);
    }

    throw new Error("Error!")
}