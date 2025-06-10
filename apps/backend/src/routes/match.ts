import { Hono } from "hono";
import { db} from "@/backend/db";
import {
  matchQueryParams,
  MatchType
} from "@/backend/db/types";
import { match, matchParticipant, participant, tournament, user } from "../db/schema";
import { auth_vars } from "../lib/auth";
import { zValidator } from "@hono/zod-validator";
import { asc, eq, count, and, ne} from "drizzle-orm";
import logger from "../lib/logger";

export const matchRoute = new Hono<auth_vars>()
  .get(
    "/:id{[0-9]+}",
    async (c) => {
      try {
        const id = Number.parseInt(c.req.param("id"));

        const header = await db.select({
          id: match.id,
          level: match.level,
          winner: user.name,
          tournamentId: tournament.id,
          tournament: tournament.name,
          startTime: match.time,
          state: match.state,
          nextMatchId: match.nextMatch,
        })
        .from(match)
        .innerJoin(tournament,eq(match.tournament,tournament.id))
        .leftJoin(user,eq(match.winner,user.id))
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

        const res: MatchType = {...header, startTime: header.startTime ?? "",href: `/matches/${id}`, participants: participants}
        return c.json(res, 200);
      } catch {
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
          winner: string | null,
          tournamentId: number,
          tournament: string,
          time: string | null,
          participants?: string,
        })[]

      const [result, totalCount] = await db.transaction(async (tx) => {

        const res: RES = await tx.select({
          id: match.id,
          level: match.level,
          winner: user.name,
          tournamentId: tournament.id,
          tournament: tournament.name,
          time: tournament.time,
        })
          .from(matchParticipant)
          .innerJoin(match,eq(matchParticipant.match,match.id))
          .innerJoin(participant,eq(matchParticipant.participant,participant.id))
          .innerJoin(tournament,eq(participant.tournament,tournament.id))
          .leftJoin(user,eq(match.winner,user.id))
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
  