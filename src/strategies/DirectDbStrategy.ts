import { SqlStatement } from "../domain/ExportQuery";
import { PgExportRepository } from "../repositories/PgExportRepository";
import type { Request, Response } from "express";
import { JsonlTransform } from "../streams/JsonlTransform";
import { runPipeline } from "../streams/pipeline";

export class DirectDbStrategy {
  constructor(private repo: PgExportRepository) {}

  async execute(req: Request, res: Response, stmt: SqlStatement) {
    res.status(200);
    res.setHeader("content-type", "application/x-ndjson");
    res.setHeader("Cache-Control", "no-store");

    const { stream, release } = await this.repo.createRowStream(stmt);
    const json = new JsonlTransform();

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      try {
        stream.destroy();
      } catch (e) {}
      try {
        release();
      } catch (e) {}
    };

    req.on("close", cleanup);
    stream.on("error", cleanup);
    res.on("error", cleanup);

    try {
      await runPipeline(stream, json, res);
    } finally {
      cleanup();
    }
  }
}
