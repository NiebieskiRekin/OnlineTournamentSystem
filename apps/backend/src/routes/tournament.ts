import { Hono } from "hono";
import { db} from "@/backend/db";
import {
  tournamentInsertSchema,
  tournamentUpdateSchema,
  tournamentQueryParams,
  participantInsertSchema,
  tournamentColumnFilters, 
  tournamentSorting,
  MatchType
} from "@/backend/db/types";
import { match, participant, tournament, user, matchParticipant } from "../db/schema";
import { auth_vars } from "../lib/auth";
import { zValidator } from "@hono/zod-validator";
import { asc, eq, count, or, like, sql, between, gt, and, gte, SQL } from "drizzle-orm";
import { addHours } from "../lib/date-utils";
import logger from "../lib/logger";
import z from "zod";
import { createGroups } from "../lib/scheduler";

// eslint-disable-next-line drizzle/enforce-delete-with-where
export const tournamentRoute = new Hono<auth_vars>()
  .get(
    "/:id{[0-9]+}/scoreboard",
    async (c) => {
      try {
        const id = Number.parseInt(c.req.param("id"));

        // Get all matches
        const header = await db.select({
          id: match.id,
          level: match.level,
          state: match.state,
          nextMatchId: match.nextMatch,
        })
        .from(match)
        .where(eq(match.tournament,id))

        // Get participants for each match
        const participants = await db.select({
          name: user.name,
          user: user.id,
          id: participant.id,
          score: participant.score,
          status: matchParticipant.state,
          match: matchParticipant.match
        }).from(matchParticipant)
        .innerJoin(participant,eq(matchParticipant.participant,participant.id))
        .innerJoin(user,eq(participant.user,user.id))
        .where(eq(participant.tournament,id))


        const result: MatchType[] = header.map((h)=>{
          return {
            id: h.id,
            level: h.level,
            state: h.state,
            nextMatchId: h.nextMatchId,
            participants: participants.filter((p)=>{
              return p.match === h.id
            })
          }
        })

        return c.json({data: result, meta: {totalCount: result.length}})
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
      tournamentQueryParams
    ),
    async (c) => {
      try {
        const {pageIndex,pageSize,columnFilters: columnFiltersRaw,sorting: sortingRaw,globalFilter,participant: participantId} = c.req.valid("query")
        const page = pageIndex || 0
        const limit = pageSize || 20
        const offset = page * limit
      
        let columnFilters: z.infer<typeof tournamentColumnFilters> = []
        if (columnFiltersRaw){
          const temp = await tournamentColumnFilters.spa(columnFiltersRaw)
          if (temp.success){
            columnFilters = temp.data
          } else {
            logger.error(temp.error)
          }
        }

        let sorting: z.infer<typeof tournamentSorting> = []
        if (sortingRaw){
          const temp1 = sortingRaw
          logger.info(temp1)
          const temp = await tournamentSorting.spa(temp1)
          if (temp.success){
            sorting = temp.data
          } else {
            logger.error(temp.error)
          }
        }

        logger.info("filters" + JSON.stringify(columnFilters))
        logger.info("sorting" + JSON.stringify(sorting))


        let query = db.select({
          id: tournament.id,
          name: tournament.name,
          discipline: tournament.discipline,
          organizer: user.name,
          organizerId: user.id,
          time: tournament.time,
          maxParticipants: tournament.maxParticipants,
          applicationDeadline: tournament.applicationDeadline,
        }).from(tournament)
        .leftJoin(user,eq(tournament.organizer,user.id))
        .$dynamic();

        let totalCountQuery = db.select({count: count()}).from(tournament).leftJoin(user,eq(tournament.organizer,user.id)).$dynamic()

        if (participantId){
          query.leftJoin(participant,eq(participant.tournament,tournament.id)).where(eq(participant.user,participantId))
          totalCountQuery.leftJoin(participant,eq(participant.tournament,tournament.id)).where(eq(participant.user,participantId))
        }

        const whereConditions = [];

        if (globalFilter){
          const searchTerm = `%${globalFilter.toLowerCase()}%`;
          whereConditions.push(
              or(
                  like(sql<string>`lower(${tournament.name})`, searchTerm),
                  like(sql<string>`lower(${tournament.discipline})`, searchTerm),
                  like(sql<string>`lower(${user.name})`, searchTerm),
              )
          );
        }

        columnFilters?.forEach((val)=>{
          switch(val.id){
            case "id":
              whereConditions.push(eq(tournament.id, val.value as number))
              break;
            case "name":
              whereConditions.push(like(tournament.name, `%${val.value}%`))
              break;
            case "discipline":
              whereConditions.push(like(tournament.discipline, `%${val.value}%`))
              break;
            case "organizer":
              whereConditions.push(like(user.name, `%${val.value}%`))
              break;
            case "time":
              whereConditions.push(between(tournament.time, addHours(val.value as string, -1), addHours(val.value as string, 1)))
              break;
            case "maxParticipants":
              whereConditions.push(gte(tournament.maxParticipants, val.value as number))
              break;
            case "applicationDeadline":
              whereConditions.push(gt(tournament.applicationDeadline, (val.value as string)))
              break;
        }})

        const orderByConditions: SQL[] = []
        
        sorting.forEach(sort => {
          const orderby = sort.desc ? `DESC` : `ASC`
          switch(sort.id){
            case "id":
              orderByConditions.push(sql.raw(`tournament.id ${orderby}`))
              break;
            case "name":
              orderByConditions.push(sql.raw(`tournament.name ${orderby}`))
              break;
            case "discipline":
              orderByConditions.push(sql.raw(`tournament.discipline ${orderby}`))
              break;
            case "organizer":
              orderByConditions.push(sql.raw(`user.name ${orderby}`))
              break;
            case "time":
              orderByConditions.push(sql.raw(`tournament.time ${orderby}`))
              break;
            case "maxParticipants":
              orderByConditions.push(sql.raw(`tournament.max_participants ${orderby}`))
              break;
            case "applicationDeadline":
              orderByConditions.push(sql.raw(`tournament.application_deadline ${orderby}`))
              break;
            default:
              break;
          }
        })

        logger.info(orderByConditions);

        if (sorting.length === 0) {
          orderByConditions.push(asc(tournament.id));
        }

        if (whereConditions.length > 0) {
          query = query.where(and(...whereConditions));
          totalCountQuery = totalCountQuery.where(and(...whereConditions));
        }

        const totalCount = (await totalCountQuery.then((res)=>res[0])).count;

        const res = await query
            .orderBy(...orderByConditions)
            .limit(limit)
            .offset(offset);
        
        const response = {data: res, meta: {totalCount: totalCount, page: page, pageSize: limit}}
        return c.json(response, 200);
      } catch (e) {
        logger.error(e)
        return c.json({ error: "Server error" }, 500);
      }
    }
  )
  .post(
    "/",
    zValidator("json", tournamentInsertSchema),
    async (c) => {
      try {
        const user_session = c.get("user");
        const session = c.get("session");
        if (!session || !user_session){
          return c.json({error: "Unauthorized"}, 401);
        }

        const req = c.req.valid("json");

        if (req.time < new Date() || req.applicationDeadline != null && req.applicationDeadline < new Date()){
          return c.json({error: "Cannot host a tournament in the past"}, 400);
        }

        const result = await db
          .insert(tournament)
          .values({...req, organizer: user_session.id, time: req.time.toISOString(), applicationDeadline: req.applicationDeadline?.toISOString()})
          .returning()
          .then((res) => res[0]);

        return c.json(result, 200);
      } catch {
        return c.json({ error: "Server error" }, 500);
      }
    }
  )
  .patch(
    "/",
    zValidator("json", tournamentUpdateSchema),
    async (c) => {
      try {
        const user_session = c.get("user");
        const session = c.get("session");
        if (!session || !user_session){
          return c.json({error: "Unauthorized"}, 401);
        }

        const req = c.req.valid("json");

        const result = await db
            .update(tournament)
            .set({...req, time: req.time?.toISOString(), applicationDeadline: req.applicationDeadline?.toISOString()})
            .where(
              and(
                eq(tournament.id, req.id),
                eq(tournament.organizer,user_session.id)
              )
            )
            .returning()
            .then((res) => res[0])

        if (!result) {
            return c.json({error: "Not found"}, 404);
        }

        return c.json(result, 200);
      } catch {
        return c.json({ error: "Server error" }, 500);
      }
    }
  )
  .get(
    "/:id{[0-9]+}",
    async (c) => {
      try {
        const id = Number.parseInt(c.req.param("id"));

        logger.info("id ok")
        const result = await db
          .select({
            id: tournament.id,
            name: tournament.name,
            discipline: tournament.discipline,
            organizer: user.name,
            organizerId: user.id,
            time: tournament.time,
            participants: tournament.participants,
            maxParticipants: tournament.maxParticipants,
            applicationDeadline: tournament.applicationDeadline,
            location: tournament.location,
            sponsorLogos: tournament.sponsorLogos,
            groupsCreated: tournament.groupsCreated
          })
          .from(tournament)
          .leftJoin(user,eq(tournament.organizer,user.id))
          .where(eq(tournament.id, id))
          .then((res) => res[0]);

          logger.info("result", result)

        if (!result) {
          return c.json({error: "Not found"}, 404);
        }

        const participants = await db
          .select({
            user: user.name,
            score: participant.score,
            licenceNumber: participant.licenseNumber
          }).from(participant)
          .innerJoin(tournament,eq(participant.tournament,tournament.id))
          .innerJoin(user,eq(participant.user,user.id)).
          where(eq(tournament.id,id));

          logger.info("part", participants)

        return c.json({...result, participantsList: participants});
      } catch {
        return c.json({ error: "Server error" }, 500);
      }
    }
  )
  .delete(
    "/:id{[0-9]+}",
    async (c) => {
      try {
        const user_session = c.get("user");
        const session = c.get("session");
        if (!session || !user_session){
          return c.json({error: "Unauthorized"}, 401);
        }

        const id = Number.parseInt(c.req.param("id"));

        const result = await db
          .delete(tournament)
          .where(
            and(
              eq(tournament.id, id),
              eq(tournament.organizer,user_session.id)
            )
          )
          .returning()
          .then((res) => res[0]);

        if (!result) {
          return c.json({error: "Not found"}, 404);
        }

        return c.json(result);
      } catch {
        return c.json({ error: "Server error" }, 500);
      }
    }
  )
  .get(
    ":id{[0-9]+}/participant",
    async (c) => {
      try {
        const id = Number.parseInt(c.req.param("id"));
        const res = await db.select({
          user: user.name,
          id: user.id,
          score: participant.score,
          licenseNumber: participant.licenseNumber
        }).from(participant).innerJoin(user,eq(participant.user,user.id)).where(eq(participant.tournament,id));
        const tournamentData = (await db.select({participants: tournament.participants,maxParticipants: tournament.maxParticipants}).from(tournament).where(eq(tournament.id,id)).then((res)=>res[0]));
        const response = {data: res, meta: {totalCount: tournamentData.participants, maxParticipants: tournamentData.maxParticipants}}
        return c.json(response, 200);
      } catch {
        return c.json({ error: "Server error" }, 500);
      }
    }
  )
  .post(
    ":id{[0-9]+}/participant",
    zValidator("json", participantInsertSchema),
    async (c) => {
      try {
        const user_session = c.get("user");
        const session = c.get("session");
        const req = c.req.valid("json");
        if (!session || !user_session){
          return c.json({error: "Unauthorized"}, 401);
        }
        const id = Number.parseInt(c.req.param("id"));
        const tour = await db.select().from(tournament).where(eq(tournament.id,id)).then((res) => res[0]);
        if (!tour){
          return c.json({error: "Not found"}, 404);
        }

        const pastApplicationDate = tour.applicationDeadline != null && Date.parse(tour.applicationDeadline) < Date.now() 
        if (pastApplicationDate || tour.participants >= tour.maxParticipants){
          return c.json({error: "Cannot apply to this tournament"}, 400);
        }

        const res = (await db.transaction(async (tx) =>{
          const participantQuery = tx.insert(participant).values({...req, user: user_session.id, tournament: id}).returning({score: participant.score, licenseNumber: participant.licenseNumber}).then((res) => res[0]);
          const tournamentQuery = tx.update(tournament).set({participants: sql`${tournament.participants}+1`}).where(eq(tournament.id,id)).returning({participants: tournament.participants}).then((res)=>res[0])
          return Promise.all([participantQuery,tournamentQuery])
        }))

        return c.json({
          score: res[0].score,
          licenseNumber: res[0].licenseNumber,
          participants: res[1].participants
        }, 200);
      } catch {
        return c.json({ error: "Server error" }, 500);
      }
    }
  ).delete(
    ":id{[0-9]+}/participant",
    async (c) => {
      try {
        const user_session = c.get("user");
        const session = c.get("session");
        if (!session || !user_session){
          return c.json({error: "Unauthorized"}, 401);
        }

        const id = Number.parseInt(c.req.param("id"));
        const tour = await db.select().from(tournament).where(eq(tournament.id,id)).then((res) => res[0]);
        if (!tour){
          return c.json({error: "Not found"}, 404);
        }

        if (tour.applicationDeadline != null && Date.parse(tour.applicationDeadline) < Date.now()){
          return c.json({error: "Cannot leave this tournament"}, 400);
        }

        const res = (await db.transaction(async (tx) =>{
          const participantQuery = tx.delete(participant).where(and(eq(participant.tournament,id), eq(participant.user,user_session.id))).returning().then((res) => res[0]);
          const tournamentQuery = tx.update(tournament).set({participants: sql`${tournament.participants}-1`}).where(eq(tournament.id,id)).returning({participants: tournament.participants}).then((res)=>res[0])
          return Promise.all([participantQuery,tournamentQuery])
        }))

        return c.json({
          score: res[0].score,
          licenseNumber: res[0].licenseNumber,
          participants: res[1].participants
        }, 200);
      } catch {
        return c.json({ error: "Server error" }, 500);
      }
    }
  )
  .post( // Trigger matchmaking for the specified tournament
    ":id{[0-9]+}/generate_matches",
    async (c) => {
      try {
        const user_session = c.get("user");
        const session = c.get("session");
        if (!session || !user_session){
          return c.json({error: "Unauthorized"}, 401);
        }

        const tournamentId = Number.parseInt(c.req.param("id"));

        const info = await db.select().from(tournament).where(eq(tournament.id,tournamentId));

        if (info.length === 0 || info[0].organizer !== user_session.id){
          return c.json({error: "Not found"}, 404);
        }

        if (info[0].groupsCreated){
          return c.json({error: "Already calculated"}, 400);
        }

        if (await createGroups(tournamentId)){
          return c.json({ message: "Success"}, 200);
        } else {
          return c.json({ error: "Not enough participants" }, 400);
        }
      } catch {
        return c.json({ error: "Server error" }, 500);
      }
    }
  )
