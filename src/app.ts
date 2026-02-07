import express from "express";
import { env } from "./config/env";
import { buildRoutes } from "./http/routes";
import { resolve } from "path";
import dotenv from "dotenv";

dotenv.config();

export function app() {
  const server = express();

  // API routes
  server.use(buildRoutes());

  // Health
  server.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  // Serve frontend view (static)
  server.use(express.static(resolve(process.cwd(), "public")));

  // Optional: default route to open UI
  server.get("/", (_req, res) => {
    res.sendFile(resolve(process.cwd(), "public", "index.html"));
  });

  server.listen(env.PORT, () => {
    console.log(`Server running at http://localhost:${env.PORT}`);
  });
}
