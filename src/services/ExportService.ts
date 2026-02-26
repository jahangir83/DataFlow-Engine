import { createHash } from "crypto";
import { ExportQueryKey } from "../domain/ExportQueryKey";
import { DirectDbStrategy } from "../strategies/DirectDbStrategy";
import { FileCacheStrategy } from "../strategies/FileCacheStrategy";
import { buildExportStatement } from "./exportQueries";

export class ExportService {
  constructor(
    public direct: DirectDbStrategy,
    public fileCache: FileCacheStrategy,
  ) {}

  async stream(
    req: import("express").Request,
    res: import("express").Response,
  ) {
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

  async debug(req: import("express").Request, res: import("express").Response) {
    try {
      const queryKey = String(req.query.queryKey || "") as ExportQueryKey;
      if (!queryKey) {
        res.status(400).json({ error: "Missing export query key" });
        return;
      }
      const params = req.query;
      const stmt = buildExportStatement(queryKey, params);
      // Log SQL and params
      console.log("[DEBUG] SQL:", stmt.sql);
      console.log("[DEBUG] Params:", params);

      // Use repo to fetch sample row and count
      const repo = this.direct.repo;
      const { rows, sample } = await repo.debugQuery(stmt);
      res.json({
        queryKey,
        params,
        rowsFound: rows,
        sample: sample || null,
      });
    } catch (e: any) {
      res.status(400).json({ error: e?.message || "Bad request" });
    }
  }
}

function makeCacheKey(key: string, query: any) {
  const raw = JSON.stringify({ key, query });
  return createHash("sha1").update(raw).digest("hex");
}
