import { Hono } from "hono";
import { auth, auth_vars } from "../lib/auth";
import { tournamentRoute } from "./tournament";
import { matchRoute } from "./match";
import { auth_middleware } from "../middleware/auth-middleware";
import { logger as honoLogger } from "hono/logger";
import { cors } from "hono/cors";

export function registerRoutes(app: Hono<auth_vars>) {
  return app
    .basePath("/api")
    .use(auth_middleware)
    .on(["POST", "GET"], "/auth/**", (c) => auth.handler(c.req.raw))
    .use(
      cors({
        origin: "http://localhost:5173",
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["POST", "GET", "OPTIONS"],
        exposeHeaders: ["Content-Length"],
        maxAge: 600,
        credentials: true,
      }),
    ).use(honoLogger())
    .route("/tournament",tournamentRoute)
    .route("/match",matchRoute)
}
export const apiRoutes = registerRoutes(new Hono<auth_vars>());

export type ApiRoutes = typeof apiRoutes;
