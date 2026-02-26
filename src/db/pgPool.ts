import { Pool } from "pg";
import { env } from "../config/env";

export const pgPool = new Pool({
  connectionString: env.DATABASE_URL ?? process.env.DATABASE_URL,
});
