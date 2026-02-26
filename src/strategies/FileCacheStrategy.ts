import { resolve } from "path";
import { PgExportRepository } from "../repositories/PgExportRepository";
import { mkdir, stat } from "fs/promises";
import { SqlStatement } from "../domain/ExportQuery";
import { JsonlTransform } from "../streams/JsonlTransform";
import { createReadStream, createWriteStream } from "fs";
import { runPipeline } from "../streams/pipeline";
import type { Request, Response } from "express";

export class FileCacheStrategy {
  private cacheDirAbs: string;

  constructor(
    public repo: PgExportRepository,
    cacheDir = "tmp/exports",
  ) {
    this.cacheDirAbs = resolve(process.cwd(), cacheDir);
  }

  private async ensureDir() {
    await mkdir(this.cacheDirAbs, { recursive: true });
  }

  private filePath(cacheKey: string) {
    return resolve(this.cacheDirAbs, `${cacheKey}.jsonl`);
  }

  private async fileExists(path: string) {
    try {
      await stat(path);
      return true;
    } catch (e: any) {
      console.error("Error checking file existence:", e);
      return false;
    }
  }

  async execute(
    req: Request,
    res: Response,
    stmt: SqlStatement,
    cacheKey: string,
  ) {
    await this.ensureDir();
    const path = this.filePath(cacheKey);

    let justCreated = false;
    if (!(await this.fileExists(path))) {
      const { stream, release } = await this.repo.createRowStream(stmt);
      const jsonl = new JsonlTransform();
      const writer = createWriteStream(path, { flags: "w" });
      let cleaned = false;
      const cleanupDb = () => {
        if (cleaned) return;
        cleaned = true;
        try {
          writer.destroy();
        } catch (e) {}
        try {
          stream.destroy();
        } catch (e) {}
        try {
          release();
        } catch {}
      };
      req.on("close", cleanupDb);
      stream.on("error", cleanupDb);
      writer.on("error", cleanupDb);
      try {
        await runPipeline(stream, jsonl, writer);
      } finally {
        cleanupDb();
      }
      justCreated = true;
    }

    // Always stream the file to the client
    res.status(200);
    res.setHeader("content-type", "application/x-ndjson");
    res.setHeader("Cache-Control", "no-store");

    const reader = createReadStream(path);
    let cleaned2 = false;
    const cleanUpFile = () => {
      if (cleaned2) return;
      cleaned2 = true;
      try {
        reader.destroy();
      } catch (e) {}
    };
    req.on("close", cleanUpFile);
    reader.on("error", cleanUpFile);
    res.on("error", cleanUpFile);
    try {
      await runPipeline(reader, res);
    } finally {
      cleanUpFile();
    }
  }
}
