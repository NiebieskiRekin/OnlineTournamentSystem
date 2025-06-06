import { Hono } from "hono";
import { auth_vars } from "../lib/auth";
import { tournamentRoute } from "./tournament";

export function registerRoutes(app: Hono<auth_vars>) {
  return app
    .basePath("/api")
    .route("/tournament",tournamentRoute)
}
export const apiRoutes = registerRoutes(new Hono<auth_vars>());

export type ApiRoutes = typeof apiRoutes;
