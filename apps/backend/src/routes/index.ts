import {hono} from "@/backend/hono"

export function registerRoutes(app: typeof hono) {
  return app
    .basePath("/api")
}
export const apiRoutes = registerRoutes(hono);

export type ApiRoutes = typeof apiRoutes;
