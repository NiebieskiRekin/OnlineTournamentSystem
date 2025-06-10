import { Hono } from "hono";
import { db} from "@/backend/db";
import {
  matchParticipantStateSchema,
  matchQueryParams,
  MatchType
} from "@/backend/db/types";
import { match, matchParticipant, participant, tournament, tournamentWinners, user } from "../db/schema";
import { auth_vars } from "../lib/auth";
import { zValidator } from "@hono/zod-validator";
import { asc, eq, count, and, ne, sql} from "drizzle-orm";
import logger from "../lib/logger";
import { z } from "zod";

const schema = z.object({
  participant: z.number(),
  status: matchParticipantStateSchema,
  score: z.number().optional(),
})

export const matchRoute = new Hono<auth_vars>()
  .get(
    "/:id{[0-9]+}",
    async (c) => {
      try {
        const id = Number.parseInt(c.req.param("id"));

        const header = await db.select({
          id: match.id,
          level: match.level,
          tournamentId: tournament.id,
          tournament: tournament.name,
          state: match.state,
          nextMatchId: match.nextMatch,
        })
        .from(match)
        .innerJoin(tournament,eq(match.tournament,tournament.id))
        .where(eq(match.id,id))
        .then((res)=>res[0])

        const participants = await db.select({
          name: user.name,
          user: user.id,
          id: participant.id,
          score: participant.score,
          licenceNumber: participant.licenseNumber,
          status: matchParticipant.state
        }).from(matchParticipant)
        .innerJoin(participant,eq(matchParticipant.participant,participant.id))
        .innerJoin(user,eq(participant.user,user.id))
        .where(eq(matchParticipant.match,id))

        const res: MatchType = {...header,href: `/matches/${id}`, participants: participants}
        return c.json(res, 200);
      } catch {
        return c.json({ error: "Server error" }, 500);
      }
    }
  )
  .post(
    "/:id{[0-9]+}",
    zValidator("json", schema),
    async (c) => {
      try {
        const user_session = c.get("user");
        const session = c.get("session");
        if (!session || !user_session){
          return c.json({error: "Unauthorized"}, 401);
        }

        const id = Number.parseInt(c.req.param("id"));
        const req = c.req.valid("json");

        const matchData = await db.select().from(match).where(eq(match.id,id)).then((res)=>res[0]);

        if (!matchData){
          return c.json({error: "Not found"}, 404);
        }

        const participantData = (await db.select().from(matchParticipant).innerJoin(participant,eq(matchParticipant.participant,participant.id)).where(eq(matchParticipant.match,id)));

        const isParticipant = participantData.some(p => p.participant.user === user_session.id);

        if (!isParticipant){
           return c.json({error: "Unauthorized"}, 401);
        }

        await db.transaction(async (tx) => {
          if (req.score){
            await tx.update(matchParticipant)
            .set({ state: req.status, score: sql`${matchParticipant.score}+${req.score}`})
            .where(and(eq(matchParticipant.match, id), eq(matchParticipant.participant, req.participant)));
          } else {
            await tx.update(matchParticipant)
            .set({ state: req.status})
            .where(and(eq(matchParticipant.match, id), eq(matchParticipant.participant, req.participant)));
          }

          // Check if all results are set
          const all_results = await tx.select().from(matchParticipant).where(eq(matchParticipant.match,id))

          if (all_results.every((v)=>v.state!='NOT_PLAYED')){
            let winner: typeof all_results[0] | undefined;
            for (const p of all_results){
              if (p.state === 'WON'){
                if (winner != undefined){
                  logger.warn("Multiple winners found", winner, p.participant)
                  tx.rollback()
                  return;
                }
                winner = p;
              }
            }

            if (winner === undefined){
              logger.warn("No winner found")
              tx.rollback()
              return;
            }

            if (matchData.nextMatch !== null){
              await tx.insert(matchParticipant)
              .values({
                match: matchData.nextMatch,
                participant: winner.participant,
              }).onConflictDoNothing()
            } else {
              await tx.insert(tournamentWinners)
              .values({
                tournament: matchData.tournament,
                participant: winner.participant,
              }).onConflictDoNothing()
            }
          }
        })

        return c.json({message: "Updated"}, 200);
      } catch (e) {
        logger.error(e)
        return c.json({ error: "Server error" }, 500);
      }
    }
  )
  .get(
    "/",
    zValidator(
      'query',
      matchQueryParams
    ),
    async (c) => {
      try {
        const {pageIndex,pageSize,user: rawUserId} = c.req.valid("query")
        const page = pageIndex || 0
        const limit = pageSize || 20
        const offset = page * limit
        const userId = rawUserId || c.get("session")?.userId

        if (!userId){
          return c.json({error: "Invalid request"}, 400);
        }

        type RES =  ({
          id: number,
          level: number,
          tournamentId: number,
          tournament: string,
          time: string | null,
          participants?: string,
        })[]

      const [result, totalCount] = await db.transaction(async (tx) => {

        const res: RES = await tx.select({
          id: match.id,
          level: match.level,
          tournamentId: tournament.id,
          tournament: tournament.name,
          time: tournament.time,
        })
          .from(matchParticipant)
          .innerJoin(match,eq(matchParticipant.match,match.id))
          .innerJoin(participant,eq(matchParticipant.participant,participant.id))
          .innerJoin(tournament,eq(participant.tournament,tournament.id))
          .where(eq(participant.user,userId))
          .orderBy(asc(match.id))
          .limit(limit)
          .offset(offset)

          res.forEach((row)=>{
            const subquery = tx.select({name: user.name, id: user.id}).from(matchParticipant)
            .innerJoin(participant,eq(matchParticipant.participant,participant.id))
            .innerJoin(user,eq(participant.user,user.id))
            .where(
              and(
                ne(participant.user,userId),
                eq(matchParticipant.match,row.id)
              )
            )

            subquery.then((res)=>{
              row.participants = res.map((p)=>{
                return p.name
              }).join(", ")
            }).catch((err)=>{
              logger.error(err)
            })
          })

          
  
          const totalCountQuery = tx.select({count: count()})
          .from(matchParticipant)
          .innerJoin(participant,eq(matchParticipant.participant,participant.id))
          .where(eq(participant.user,userId))
          .then((res)=>res[0])
  

          return Promise.all([res,totalCountQuery])
        })

        const response = {data: result, meta: {totalCount: totalCount.count, page: page, pageSize: limit}}
        return c.json(response, 200);
      } catch (e) {
        logger.error(e)
        return c.json({ error: "Server error" }, 500);
      }
    }
  )
  