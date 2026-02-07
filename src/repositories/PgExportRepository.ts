import QueryStream from "pg-query-stream";
import { pgPool } from "../db/pgPool";
import type { ExportQuery, SqlStatement } from "../domain/ExportQuery";
import type { Readable } from "stream";
import { env } from "../config/env";

export class PgExportRepository {
  async createRowStream(
    exportQuery: SqlStatement,
  ): Promise<{ stream: Readable; release: () => void }> {
    const client = await pgPool.connect();

    try {
      const queryStream = new QueryStream(
        exportQuery.sql,
        exportQuery.params ?? [],
        {
          highWaterMark: 1000, // Adjust the batch size as needed
        },
      );
      const stream = client.query(queryStream);
      return { stream, release: () => client.release() };
    } catch (err) {
      client.release();
      throw err;
    }
  }
}
