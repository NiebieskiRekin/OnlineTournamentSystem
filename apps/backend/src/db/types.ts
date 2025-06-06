import { z } from "@hono/zod-openapi";
import {
    createSelectSchema,
    createInsertSchema,
    createUpdateSchema,
  } from "drizzle-zod";
import { discipline, match, participant, sponsor, tournament } from "./schema";

export const disciplineSelectSchema = createSelectSchema(discipline);
export type Discipline = z.infer<typeof disciplineSelectSchema>;
export const disciplineUpdateSchema = createUpdateSchema(discipline).required({
    id: true
});
export const disciplineInsertSchema = createInsertSchema(discipline);

export const sponsorSelectSchema = createSelectSchema(sponsor);
export type Sponsor = z.infer<typeof sponsorSelectSchema>;
export const sponsorUpdateSchema = createUpdateSchema(sponsor).required({
    id: true
});
export const sponsorInsertSchema = createInsertSchema(sponsor);

export const tournamentSelectSchema = createSelectSchema(tournament);
export type Tournament = z.infer<typeof tournamentSelectSchema>;
export const tournamentUpdateSchema = createUpdateSchema(tournament).required({
    id: true
});
export const tournamentInsertSchema = createInsertSchema(tournament);

export const participantSelectSchema = createSelectSchema(participant);
export type Participant = z.infer<typeof participantSelectSchema>;
export const participantUpdateSchema = createUpdateSchema(participant).required({
    match: true,
    user: true
});
export const participantInsertSchema = createInsertSchema(participant);

export const matchSelectSchema = createSelectSchema(match);
export type Match = z.infer<typeof matchSelectSchema>;
export const matchUpdateSchema = createUpdateSchema(match).required({
    id: true
});
export const matchInsertSchema = createInsertSchema(match);