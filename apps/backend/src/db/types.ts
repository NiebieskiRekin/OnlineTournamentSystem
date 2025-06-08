import { z } from "zod";
import {
    createSelectSchema,
    createInsertSchema,
    createUpdateSchema,
  } from "drizzle-zod";
import { match, participant, tournament } from "./schema";

const literalSchema = z.union( [
    z.string(),
    z.number(),
    z.boolean(),
    z.null()
] )

type Literal = z.infer<typeof literalSchema>
type Json = Literal | { [ key: string ]: Json } | Json[]
const jsonSchema: z.ZodType<Json> = z.lazy( () =>
    z.union( [
        literalSchema,
        z.array( jsonSchema ),
        z.record( jsonSchema )
    ] )
)
export const json = () => jsonSchema
const stringToJSONSchema = z.string()
.transform( ( str, ctx ): z.infer<ReturnType<typeof json>> => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return JSON.parse( str )
    } catch {
        ctx.addIssue( { code: 'custom', message: 'Invalid JSON' } )
        return z.NEVER
    }
} )

const sorting = z.object({
    id: z.string(),
    desc: z.boolean({coerce: true})
});

const sponsorLogos = z.array(z.string().url());
const tournament_date_tweaks = {
    time: z.date({coerce: true}),
    applicationDeadline: z.date({coerce: true}).nullable()
};
const tournamentSelectSchema = createSelectSchema(tournament).extend(tournament_date_tweaks);
type Tournament = z.infer<typeof tournamentSelectSchema>;
const tournamentUpdateSchema = createUpdateSchema(tournament).extend(tournament_date_tweaks).omit({
   organizer: true
}).partial().required({
    id: true
});
const tournamentInsertSchema = createInsertSchema(tournament).extend(tournament_date_tweaks).omit({
    id: true,
    organizer: true
})
const tournamentColumnsSelection = z.enum([
    "id",
    "name",
    "discipline",
    "organizer",
    "organizerId",
    "time",
    "maxParticipants",
    "applicationDeadline",
])
const tournamentColumnFilters = z.array(z.object({id: tournamentColumnsSelection, value: z.any()}))
// .refine(async (val)=>{
//     return (await Promise.all(val.map(async (v)=>{
//         const col = tournamentSelectSchema.shape[v.id]
//         return (await col.spa(v.val)).success
//     }))).every((v)=>v)
// })
const tournamentSorting = z.array(sorting.extend({id: tournamentColumnsSelection})).default([]);
const tournamentQueryParams = z.object({
    pageIndex: z.number({coerce: true}).default(0),
    pageSize: z.number({coerce: true}).default(20),
    columnFilters: stringToJSONSchema.pipe(tournamentColumnFilters),
    sorting: stringToJSONSchema.pipe(tournamentSorting),
    globalFilter: z.string(),
    participant: z.string(),
}).partial()
const tournamentList = z.object({
    data: z.array(tournamentSelectSchema),
    meta: z.object({
        totalCount: z.number().nonnegative(),
        page: z.number().nonnegative(),
        pageSize: z.number().nonnegative()
    })
})

const participantSelectSchema = createSelectSchema(participant).omit({
    tournament: true,
}).extend({
    id: z.string()
});
type Participant = z.infer<typeof participantSelectSchema>;
const participantUpdateSchema = createUpdateSchema(participant).required({
    tournament: true,
    user: true,
});
const participantInsertSchema = createInsertSchema(participant).omit({
    tournament: true,
    user: true,
    winner: true
});

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
    tournamentSelectSchema, tournamentUpdateSchema, tournamentInsertSchema, type Tournament, tournamentQueryParams, tournamentList,
    participantSelectSchema, participantUpdateSchema, participantInsertSchema, type Participant,
    matchSelectSchema, matchUpdateSchema, matchInsertSchema, type Match,
    basicErrorSchema, sorting, sponsorLogos,
    tournamentColumnFilters, tournamentSorting,
    stringToJSONSchema
};