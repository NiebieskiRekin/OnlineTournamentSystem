import { drizzle } from "drizzle-orm/node-postgres";
import { ProcessEnv } from "../env";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export const db = drizzle({
  client: new Pool({
    connectionString: ProcessEnv.DATABASE_URL,
  }),
  schema: { ...schema },
  logger: ProcessEnv.NODE_ENV != "production" ? true : false,
});

export { eq } from "drizzle-orm";
