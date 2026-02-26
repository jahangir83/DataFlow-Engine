import { SqlStatement } from "../domain/ExportQuery";
import { PgExportRepository } from "../repositories/PgExportRepository";
import type { Request, Response } from "express";
import { JsonlTransform } from "../streams/JsonlTransform";
import { RowCounterTransform } from "../streams/RowCounterTransform";
import { runPipeline } from "../streams/pipeline";

export class DirectDbStrategy {
  constructor(public repo: PgExportRepository) {}

  async execute(req: Request, res: Response, stmt: SqlStatement) {
    res.status(200);
    res.setHeader("content-type", "application/x-ndjson");
    res.setHeader("Cache-Control", "no-store");

    const queryKey = req.query.queryKey || "unknown";
    // Write start event immediately
    res.write(
      JSON.stringify({ event: "start", queryKey, ts: Date.now() }) + "\n",
    );

    const { stream, release } = await this.repo.createRowStream(stmt);
    const rowCounter = new RowCounterTransform();
    const json = new JsonlTransform();

    let cleaned = false;
    const cleanup = (who: string) => {
      console.log(`[CLEANUP] Triggered by ${who} for queryKey=${queryKey}`);
      if (cleaned) return;
      cleaned = true;
      try {
        stream.destroy();
      } catch (e) {}
      try {
        release();
      } catch (e) {}
    };

    req.on("close", () => cleanup("request-close"));
    stream.on("error", () => cleanup("stream-error"));
    res.on("error", () => cleanup("response-error"));

    try {
      await runPipeline(stream, rowCounter, json, res);
    } finally {
      // After pipeline completes, check row count and write events
      if (rowCounter.rowCount === 0) {
        // Log when empty
        console.log(
          `[EMPTY] queryKey=${queryKey}, params=${JSON.stringify(req.query)}, 0 rows, SQL=${stmt.sql}`,
        );
        res.write(
          JSON.stringify({
            event: "empty",
            message: "No rows found",
            queryKey,
          }) + "\n",
        );
      }
      res.write(
        JSON.stringify({
          event: "end",
          rows: rowCounter.rowCount,
          ts: Date.now(),
        }) + "\n",
      );
      res.end();
      cleanup("pipeline-complete");
    }
  }
}
