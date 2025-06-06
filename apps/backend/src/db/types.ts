import { z } from "@hono/zod-openapi";
import {
    createSelectSchema,
    createInsertSchema,
    createUpdateSchema,
  } from "drizzle-zod";
import { discipline, match, participant, sponsor, tournament } from "./schema";

const disciplineSelectSchema = createSelectSchema(discipline);
type Discipline = z.infer<typeof disciplineSelectSchema>;
const disciplineUpdateSchema = createUpdateSchema(discipline).required({
    id: true
});
const disciplineInsertSchema = createInsertSchema(discipline);

const sponsorSelectSchema = createSelectSchema(sponsor);
type Sponsor = z.infer<typeof sponsorSelectSchema>;
const sponsorUpdateSchema = createUpdateSchema(sponsor).required({
    id: true
});
const sponsorInsertSchema = createInsertSchema(sponsor);

const tournamentSelectSchema = createSelectSchema(tournament);
type Tournament = z.infer<typeof tournamentSelectSchema>;
const tournamentUpdateSchema = createUpdateSchema(tournament).required({
    id: true
});
const tournamentInsertSchema = createInsertSchema(tournament).omit({
    createdAt: true,
    updatedAt: true
});

const participantSelectSchema = createSelectSchema(participant);
type Participant = z.infer<typeof participantSelectSchema>;
const participantUpdateSchema = createUpdateSchema(participant).required({
    match: true,
    user: true
});
const participantInsertSchema = createInsertSchema(participant);

const matchSelectSchema = createSelectSchema(match);
type Match = z.infer<typeof matchSelectSchema>;
const matchUpdateSchema = createUpdateSchema(match).required({
    id: true
});
const matchInsertSchema = createInsertSchema(match);

const basicErrorSchema = z.object({ error: z.string() });

export {
    disciplineSelectSchema, disciplineUpdateSchema, disciplineInsertSchema, type Discipline,
    sponsorSelectSchema, sponsorUpdateSchema, sponsorInsertSchema, type Sponsor,
    tournamentSelectSchema, tournamentUpdateSchema, tournamentInsertSchema, type Tournament,
    participantSelectSchema, participantUpdateSchema, participantInsertSchema, type Participant,
    matchSelectSchema, matchUpdateSchema, matchInsertSchema, type Match,
    basicErrorSchema
};