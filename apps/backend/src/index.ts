import app from "./app";
import { ProcessEnv } from "./env";
import { serve } from "@hono/node-server";
import logger from "./lib/logger";

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
