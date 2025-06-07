import { z } from "@hono/zod-openapi";
import {
    createSelectSchema,
    createInsertSchema,
    createUpdateSchema,
  } from "drizzle-zod";
import { discipline, match, participant, sponsor, tournament } from "./schema";

const sorting = z.object({
    id: z.string(),
    desc: z.boolean({coerce: true})
});


const disciplineSelectSchema = createSelectSchema(discipline);
type Discipline = z.infer<typeof disciplineSelectSchema>;
const disciplineUpdateSchema = createUpdateSchema(discipline).required({
    id: true
});
const disciplineInsertSchema = createInsertSchema(discipline).omit({
    id: true,
});

const sponsorSelectSchema = createSelectSchema(sponsor);
type Sponsor = z.infer<typeof sponsorSelectSchema>;
const sponsorUpdateSchema = createUpdateSchema(sponsor).required({
    id: true,
});
const sponsorInsertSchema = createInsertSchema(sponsor).omit({
    id: true
});

const tournamentDateTweaks = {
    time: z.date({coerce: true}).nullable(),
    updatedAt: z.date({coerce: true}),
    createdAt: z.date({coerce: true}),
    applicationDeadline: z.date({coerce: true}).nullable()
}
const tournamentSelectSchema = createSelectSchema(tournament).extend(tournamentDateTweaks);
type Tournament = z.infer<typeof tournamentSelectSchema>;
const tournamentUpdateSchema = createUpdateSchema(tournament).extend(tournamentDateTweaks).omit({
    createdAt: true, updatedAt: true, organizer: true
}).partial().required({
    id: true
});
const tournamentInsertSchema = createInsertSchema(tournament).extend(tournamentDateTweaks).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    organizer: true
})
const tournamentColumns = tournamentSelectSchema.keyof()
const tournamentColumnFilters = z.array(tournamentSelectSchema.partial()).default([])
const tournamentSorting = z.array(sorting.extend({id: tournamentColumns})).default([]);
const tournamentQueryParams = z.object({
    pageIndex: z.number({coerce: true}).default(0),
    pageSize: z.number({coerce: true}).default(20),
    columnFilters: z.string().refine((val)=>{
        try{
            console.log("val: ", val)
            tournamentColumnFilters.parse(JSON.parse(val))
            return true
        } catch(e: unknown) {
            console.log("val: ",e)
            return false
        }
    }).transform((val)=>tournamentColumnFilters.parse(JSON.parse(val))),
    sorting: z.string().refine((val)=>{
        try{
            tournamentSorting.parse(JSON.parse(val))
            return true
        } catch {
            return false
        }
    }).transform((val)=>tournamentSorting.parse(JSON.parse(val))),
    globalFilter: z.string()
}).partial()
const tournamentList = z.object({
    data: z.array(tournamentSelectSchema),
    meta: z.object({
        totalCount: z.number().nonnegative(),
        page: z.number().nonnegative(),
        pageSize: z.number().nonnegative()
    })
})

const participantSelectSchema = createSelectSchema(participant);
type Participant = z.infer<typeof participantSelectSchema>;
const participantUpdateSchema = createUpdateSchema(participant).required({
    match: true,
    user: true,
});
const participantInsertSchema = createInsertSchema(participant);

const matchSelectSchema = createSelectSchema(match);
type Match = z.infer<typeof matchSelectSchema>;
const matchUpdateSchema = createUpdateSchema(match).required({
    id: true
});
const matchInsertSchema = createInsertSchema(match).omit({
    id: true
});

const basicErrorSchema = z.object({ error: z.string() });

export {
    disciplineSelectSchema, disciplineUpdateSchema, disciplineInsertSchema, type Discipline,
    sponsorSelectSchema, sponsorUpdateSchema, sponsorInsertSchema, type Sponsor,
    tournamentSelectSchema, tournamentUpdateSchema, tournamentInsertSchema, type Tournament, tournamentQueryParams, tournamentList,
    participantSelectSchema, participantUpdateSchema, participantInsertSchema, type Participant,
    matchSelectSchema, matchUpdateSchema, matchInsertSchema, type Match,
    basicErrorSchema, sorting, 
};