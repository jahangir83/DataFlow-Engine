import type { SqlStatement, ExportQuery } from "../domain/ExportQuery";
import type { ExportQueryKey } from "../domain/ExportQueryKey";

type Params = Record<string, any>;

export function buildExportStatement(
  queryKey: ExportQueryKey,
  params: Params,
): SqlStatement {
  let stmt: SqlStatement;
  switch (queryKey) {
    case "SalesCampaignVariant":
      if (
        params.campaignId === null ||
        params.campaignId === undefined ||
        params.campaignId === ""
      ) {
        const limit = Number(params.limit ?? 1000);
        stmt = {
          sql: `SELECT scv.* FROM "SalesCampaignVariant" scv 
                 LIMIT $1`,
          params: [limit],
        };
      } else {
        stmt = {
          sql: `
            SELECT
              scv.*
            FROM "SalesCampaignVariant" scv
            WHERE scv."campaignId" IS NOT DISTINCT FROM $1
          `,
          params: [params.campaignId],
        };
      }
      break;
    case "ProductVariant":
      const limit = Number(params.limit); //Math.min(Number(params.limit ?? 1000), 2000);
      if (
        params.productId === null ||
        params.productId === undefined ||
        params.productId === ""
      ) {
        stmt = {
          sql: `
            SELECT
              pv.*
            FROM "ProductVariant" pv
            LIMIT $1
          `,
          params: [limit],
        };
      } else {
        stmt = {
          sql: `
            SELECT
              pv.*
            FROM "ProductVariant" pv
            WHERE pv."productId" IS NOT DISTINCT FROM $1
            LIMIT $2
          `,
          params: [params.productId, limit],
        };
      }
      break;

    default:
      throw new Error(`Unknown query key: ${queryKey}`);
  }
  // Log SQL and params for debug endpoint
  if (params && params.__debug) {
    console.log(`[DEBUG] SQL:`, stmt.sql);
    console.log(`[DEBUG] Params:`, params);
  }
  return stmt;
}
