import { ExportQueryKey } from "../domain/ExportQueryKey";
import { DirectDbStrategy } from "../strategies/DirectDbStrategy";
import { FileCacheStrategy } from "../strategies/FileCacheStrategy";
import type { Request, Response } from "express";
import { buildExportStatement } from "./exportQueries";
import { createHash } from "crypto";

function makeCacheKey(key: string, query: any) {
  const raw = JSON.stringify({ key, query });
  return createHash("sha1").update(raw).digest("hex");
}

export class ExportService {
  constructor(
    private direct: DirectDbStrategy,
    private fileCache: FileCacheStrategy,
  ) {}

  async stream(req: Request, res: Response) {
    try {
      const queryKey = String(req.query.queryKey || "") as ExportQueryKey;
      if (!queryKey) {
        res.status(400).json({ error: "Missing export query key" });
        return;
      }

      const stmt = buildExportStatement(queryKey, req.query);
      const mode = String(req.query.mode || "direct");

      if (mode == "file") {
        const cacheKey = makeCacheKey(queryKey, req.query);
        return this.fileCache.execute(req, res, stmt, cacheKey);
      }

      return this.direct.execute(req, res, stmt);
    } catch (e: any) {
      if (res.headersSent) {
        try {
          res.end();
        } catch {}
        return;
      }
      res.status(400).json({ error: e?.message || "Bad request" });
    }
  }
}
