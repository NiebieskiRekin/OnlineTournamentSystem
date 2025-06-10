import { Hono } from "hono";
import { logger as honoLogger } from "hono/logger";
import { cors } from "hono/cors";
import { registerRoutes } from "./routes";
import { auth, auth_vars } from "./lib/auth";
import { auth_middleware } from "./middleware/auth-middleware";
import logger from "./lib/logger";


const app = registerRoutes(new Hono<auth_vars>());

export const customLogger = (message: string, ...rest: string[]) => {
	logger.info("SERVER", message +  " " + rest.join(" "))
  }

app.use(honoLogger(customLogger));


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

export default app;
