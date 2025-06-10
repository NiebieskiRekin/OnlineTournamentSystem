import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { registerRoutes } from "./routes";
import { auth, auth_vars } from "./lib/auth";
import { auth_middleware } from "./middleware/auth-middleware";

const app = registerRoutes(new Hono<auth_vars>());

app.on(["POST", "GET"], "/auth/**", (c) => auth.handler(c.req.raw));

app.use(
	"*",
	cors({
		origin: "http://localhost:5173",
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

app.use("*",auth_middleware);

app.use("*", logger());

export default app;
