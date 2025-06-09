import { Hono } from "hono";
import { auth_vars } from "../lib/auth";
import { tournamentRoute } from "./tournament";
import { matchRoute } from "./match";

export function registerRoutes(app: Hono<auth_vars>) {
  return app
    .basePath("/api")
    .route("/tournament",tournamentRoute)
    .route("/match",matchRoute)
}
export const apiRoutes = registerRoutes(new Hono<auth_vars>());

export type ApiRoutes = typeof apiRoutes;
