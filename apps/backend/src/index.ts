import app from "./app";
import { ProcessEnv } from "./env";
import { serve } from "@hono/node-server";
import { log } from "./lib/logger";

export const server = serve(
  {
    port: ProcessEnv.PORT,
    hostname: "0.0.0.0",
    fetch: app.fetch,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
    log("Server", "info", "Połączono z Serwerem");
  }
);
