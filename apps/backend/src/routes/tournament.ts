import { Hono } from "hono";
import { db} from "@/backend/db";
import {
  tournamentInsertSchema,
//   tournamentSelectSchema,
  tournamentUpdateSchema,
  tournamentQueryParams,
  // tournamentList
} from "@/backend/db/types";
import { tournament, user } from "../db/schema";
import { auth_middleware } from "@/backend/middleware/auth-middleware";
import { auth_vars } from "../lib/auth";
import { zValidator } from "@hono/zod-validator";
import { asc, eq, count, or, like, sql, between, gt, and, desc } from "drizzle-orm";
import { addHours } from "../lib/date-utils";


// eslint-disable-next-line drizzle/enforce-delete-with-where
export const tournamentRoute = new Hono<auth_vars>()
  .use("*",auth_middleware)
  .get(
    "/",
    zValidator(
      'query',
      tournamentQueryParams
    ),
    async (c) => {
      try {
        const queryParams = c.req.query()
        const {pageIndex,pageSize,columnFilters,sorting,globalFilter} = tournamentQueryParams.parse(queryParams)
        const page = pageIndex || 0
        const limit = pageSize || 20
        const offset = page * limit

      
        const query = db.select({
          id: tournament.id,
          name: tournament.name,
          discipline: tournament.discipline,
          organizer: user.name,
          time: tournament.time,
          maxParticipants: tournament.maxParticipants,
          applicationDeadline: tournament.applicationDeadline,
        }).from(tournament)
        .leftJoin(user,eq(tournament.organizer,user.id))
        .$dynamic();
        const whereConditions = [];

        if (globalFilter){
          const searchTerm = `%${globalFilter.toLowerCase()}%`;
          whereConditions.push(
              or(
                  like(sql<string>`lower(${tournament.name})`, searchTerm),
                  like(sql<string>`lower(${tournament.discipline})`, searchTerm),
                  // like(sql<string>`lower(${user.name})`, searchTerm),
              )
          );
        }

        columnFilters?.forEach((val)=>{
            if (val.id){
              whereConditions.push(eq(tournament.id, val.id))
            }
            if (val.name){
              whereConditions.push(like(tournament.name, `%${val.name}%`))
            }
            if (val.discipline){
              whereConditions.push(like(tournament.discipline, `%${val.discipline}%`))
            }
            if (val.time){
              whereConditions.push(between(tournament.time, addHours(val.time, -1).toISOString(), addHours(val.time, 1).toISOString()))
            }
            if (val.applicationDeadline){
              whereConditions.push(gt(tournament.applicationDeadline, val.applicationDeadline.toISOString()))
            }
            if (val.maxParticipants){
              whereConditions.push(gt(tournament.maxParticipants, val.maxParticipants))
            }
            if (val.organizer){
              whereConditions.push(like(user.name, `%${val.organizer}%`))
            }
        })

        let totalCountQuery = db.select({count: count()}).from(tournament).$dynamic()
        if (whereConditions.length > 0){
          totalCountQuery = totalCountQuery.where(and(...whereConditions));
        }
        const totalCount = (await totalCountQuery.then((res)=>res[0])).count;

        const orderByConditions = sorting?.map(sort => {
          const col = sql<string>`${sort.id}`;
          return sort.desc ? desc(col) : asc(col)
        }) ?? []

        if (orderByConditions.length === 0) {
          orderByConditions.push(asc(tournament.id));
        }

        if (whereConditions.length > 0) {
          query.where(and(...whereConditions));
        }

        const res = await query
            .orderBy(...orderByConditions)
            .limit(limit)
            .offset(offset);
        
        const response = {data: res, meta: {totalCount: totalCount, page: page, pageSize: limit}}
        return c.json(response, 200);
      } catch {
        return c.json({ error: "Błąd serwera" }, 500);
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

        const result = await db
          .insert(tournament)
          .values({...req, organizer: user_session.id, time: req.time.toISOString(), applicationDeadline: req.applicationDeadline?.toISOString()})
          .returning()
          .then((res) => res[0]);

        return c.json(result, 200);
      } catch {
        return c.json({ error: "Błąd serwera" }, 500);
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
        return c.json({ error: "Błąd serwera" }, 500);
      }
    }
  )
  .get(
    "/:id{[0-9]+}",
    async (c) => {
      try {
        const id = Number.parseInt(c.req.param("id"));

        const result = await db
          .select()
          .from(tournament)
          .where(eq(tournament.id, id))
          .then((res) => res[0]);

        if (!result) {
          return c.json({error: "Not found"}, 404);
        }

        return c.json(result);
      } catch {
        return c.json({ error: "Błąd serwera" }, 500);
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
        return c.json({ error: "Błąd serwera" }, 500);
      }
    }
  );
