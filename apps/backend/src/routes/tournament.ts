import { Hono } from "hono";
import { db} from "@/backend/db";
import {
  tournamentInsertSchema,
//   tournamentSelectSchema,
  tournamentUpdateSchema
} from "@/backend/db/types";
import { tournament } from "../db/schema";
import { auth_middleware } from "@/backend/middleware/auth-middleware";
// import { z } from "@hono/zod-openapi";
import { auth_vars } from "../lib/auth";
import { zValidator } from "@hono/zod-validator";
import { asc, eq, count } from "drizzle-orm";

// eslint-disable-next-line drizzle/enforce-delete-with-where
export const tournamentRoute = new Hono<auth_vars>()
  .use(auth_middleware)
  .get(
    "/",
    async (c) => {
      try {
        const { limit, offset} = c.req.query()
        const res = await db.select().from(tournament)
        .orderBy(asc(tournament.id))
        .limit(Number(limit))
        .offset(Number(offset));
        const totalCount = (await db.select({count: count()}).from(tournament).then((res)=>res[0])).count
        return c.json({data: res, totalCount: totalCount}, 200);
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
        const req = c.req.valid("json");

        const result = await db
          .insert(tournament)
          .values(req)
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
        const req = c.req.valid("json");

        const result = await db
            .update(tournament)
            .set({...req, updatedAt: new Date(Date.now())})
            .where(eq(tournament.id, req.id))
            .returning()
            .then((res) => res[0])

        if (!result) {
            return c.notFound();
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
            return c.notFound();
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
        const id = Number.parseInt(c.req.param("id"));

        const result = await db
          .delete(tournament)
          .where(eq(tournament.id, id))
          .returning()
          .then((res) => res[0]);

        if (!result) {
          return c.notFound();
        }

        return c.json(result);
      } catch {
        return c.json({ error: "Błąd serwera" }, 500);
      }
    }
  );
