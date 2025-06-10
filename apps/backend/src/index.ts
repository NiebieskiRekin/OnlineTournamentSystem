import { ProcessEnv } from "./env";
import { serve } from "@hono/node-server";
import logger from "./lib/logger";
import { Hono } from "hono";
import { registerRoutes } from "./routes";
import { auth_vars } from "./lib/auth";

const app = registerRoutes(new Hono<auth_vars>())

export const server = serve(
  {
    port: ProcessEnv.PORT,
    hostname: "0.0.0.0",
    fetch: app.fetch,
  },
  (info) => {
    logger.info(`Server is running on http://localhost:${info.port}`);
  }
);
