import { Hono } from "hono";
import { auth_vars } from "../lib/auth";

export function registerRoutes(app: Hono<auth_vars>) {
  return app
    .basePath("/api")
}
export const apiRoutes = registerRoutes(new Hono<auth_vars>());

export type ApiRoutes = typeof apiRoutes;
