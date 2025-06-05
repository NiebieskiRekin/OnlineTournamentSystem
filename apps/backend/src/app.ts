import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { ProcessEnv } from "./env";
import { registerRoutes } from "./routes";
import { log } from "./logs/logger";
import { openAPISpecs } from "hono-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { auth, auth_vars } from "./auth";
import { auth_middleware } from "./middleware/auth-middleware";

const app = registerRoutes(new Hono<auth_vars>());

app.get(
  "/openapi",
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "API online tournament system",
        version: "0.1.0",
        description: "API online tournament system",
      },
      servers: [
        { url: "http://localhost:3000", description: "Local Server" },
      ],
    },
  })
);

app.use("/ui", swaggerUI({ url: "/api/openapi" }));

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.use(
	"*",
	cors({
		origin: "http://localhost:5173", // replace with your origin
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

app.use("*",auth_middleware);

if (ProcessEnv.NODE_ENV != "production") {
  app.use("*", logger()); // Only for testing and development
  log("Server", "info", "Połączono z Serwerem");
}

export default app;
