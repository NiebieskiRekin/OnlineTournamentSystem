import type { ApiRoutes } from "@webdev-project/backend/routes";
export {
  tournamentSelectSchema, tournamentUpdateSchema, tournamentInsertSchema, type Tournament, tournamentQueryParams, tournamentList,
  participantSelectSchema, participantUpdateSchema, participantInsertSchema, type Participant,
  matchSelectSchema, matchUpdateSchema, matchInsertSchema, type Match,
  basicErrorSchema, sorting, sponsorLogos,
  tournamentColumnFilters, tournamentSorting,
  stringToJSONSchema, matchQueryParams, matchParticipantStateSchema
} from "@webdev-project/backend/schema";
import {z} from "zod";
import { hc } from "hono/client";

// create instance to inline type in build
// https://hono.dev/docs/guides/rpc#compile-your-code-before-using-it-recommended
export const client = hc<ApiRoutes>("");
export type apiClient = typeof client;

export default (...args: Parameters<typeof hc>): apiClient =>
  hc<ApiRoutes>(...args);

export const zodErrorSchema = z.object({
  error: z.object({
    issues: z.array(z.object({
      code: z.string(),
      path: z.array(z.union([z.number(),z.string()])),
      message: z.string().optional(),
    })),
    name: z.string(),
  }),
  success: z.boolean()
});
