import express from "express";
import { PgExportRepository } from "../repositories/PgExportRepository";
import { DirectDbStrategy } from "../strategies/DirectDbStrategy";
import { FileCacheStrategy } from "../strategies/FileCacheStrategy";
import { ExportService } from "../services/ExportService";
import { ExportController } from "./ExportController";
import { asyncHandler } from "../utils/asyncHandler";
import { pgPool } from "../db/pgPool";
import QueryStream from "pg-query-stream";

export function buildRoutes() {
  const router = express.Router();

  const repo = new PgExportRepository();
  const direct = new DirectDbStrategy(repo);
  const fileCache = new FileCacheStrategy(repo);
  const service = new ExportService(direct, fileCache);
  const controller = new ExportController(service);

  // router.get("/export/stream", controller.stream.bind(controller));
  router.get(
    "/export/stream",
    asyncHandler(async (req, res) => {
      await service.stream(req, res);
    }),
  );

  router.get(
    "/export/debug",
    asyncHandler(async (req, res) => {
      await service.debug(req, res);
    }),
  );

  router.get("/jahangir", async (req, res) => {
    const client = await pgPool.connect();

    try {
      const queryStream = new QueryStream(
        `SELECT
            pv.*
          FROM public."ProductVariant" pv
    WHERE pv."productId" IS NOT DISTINCT FROM $1
          LIMIT $2`,
        [null, 100],
        {
          highWaterMark: 1000, // Adjust the batch size as needed
        },
      );
      const stream = client.query(queryStream);

      stream.on("data", (row) => {
        console.log(row);
      });

      stream.on("end", () => {
        console.log("Stream ended");
      });

      stream.on("error", (err) => {
        console.error("Stream error:", err);
      });

      await new Promise((resolve, reject) => {
        stream.on("end", resolve);
        stream.on("error", reject);
      });

      res.status(200).json({ status: "ok" });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      client.release();
    }
  });
  return router;
}
