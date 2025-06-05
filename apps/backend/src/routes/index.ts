import { Hono } from "hono";

export function registerRoutes(app: Hono) {
  return app
    .basePath("/api")
}
export const apiRoutes = registerRoutes(new Hono());

export type ApiRoutes = typeof apiRoutes;
