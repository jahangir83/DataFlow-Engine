import dotenv from "dotenv";

dotenv.config();

export const env = {
  PG_HOST: process.env.PG_HOST || "localhost",
  PG_PORT: Number(process.env.PG_PORT) || 5432,
  PG_USER: process.env.PG_USER || "",
  PG_PASSWORD: process.env.PG_PASSWORD || "",
  PG_DATABASE: process.env.PG_DATABASE || "",
  EXPORT_PATH: process.env.EXPORT_PATH || "./exports",

  PORT: Number(process.env.PORT || 3000),
  DATABASE_URL: process.env.DATABASE_URL || "",
};
