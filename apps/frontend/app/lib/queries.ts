import {
    disciplineSelectSchema, disciplineUpdateSchema,
    sponsorSelectSchema, sponsorUpdateSchema,
    tournamentUpdateSchema, tournamentInsertSchema,
    participantSelectSchema, participantUpdateSchema,
    matchSelectSchema, matchUpdateSchema,
    basicErrorSchema, zodErrorSchema
} from '@webdev-project/api-client';
import { queryOptions } from "@tanstack/react-query";
import apiClient from "./api-client";
import {z} from "zod";

export const queryKeys = {
  LIST_TOURNAMENTS: { queryKey: ["list-tournaments"] },
  LIST_TOURNAMENT: (id: string) => ({ queryKey: [`list-tournament-${id}`] }),
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

// export const tournamentQueryOptions = queryOptions({
//   ...queryKeys.LIST_TOURNAMENTS,
//   queryFn: async () => {
//     const response = await apiClient.api.tournament.$get();

//     if (!response.ok){
//         parseError(response)
//     }

//     const result = await response.json();
//     return result;
//   },
// });

export const createTournamentQueryOptions = (id: string) => queryOptions({
  ...queryKeys.LIST_TOURNAMENT(id),
  queryFn: async () => {
    const response = await apiClient.api.tournament[':id{[0-9]+}'].$get({
        param: {
            id
        }
    })
    if (!response.ok){
        parseError(response)
    }

    const result = await response.json();
    return result;
  },
});

export const createTournament = async (tournament: z.infer<typeof tournamentInsertSchema>) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const response = await apiClient.api.tournament.$post({
        json: tournament
    });
    if (!response.ok){
        parseError(response)
    }

    const result = await response.json();
    return result;
};

export const deleteTournament = async (id: string) => {
    const response = await apiClient.api.tournament[':id{[0-9]+}'].$delete({
        param: {
            id: id
        }
    });

    if (!response.ok){
        parseError(response)
    }

    const result = await response.json();
    return result;
};

export const updateTournament = async (tournament: z.infer<typeof tournamentUpdateSchema>) => {
  const response = await apiClient.api.tournament.$patch({
    json: tournament,
  });

  if (!response.ok){
      parseError(response)
  }

  const result = await response.json();
  return result;
};