import type { SqlStatement, ExportQuery } from "../domain/ExportQuery";
import type { ExportQueryKey } from "../domain/ExportQueryKey";

type Params = Record<string, any>;

export function buildExportStatement(
  queryKey: ExportQueryKey,
  params: Params,
): SqlStatement {
  switch (queryKey) {
    case "SalesCampaignVariant":
      return {
        sql: `
          SELECT
            scv.*
          FROM public."salesCampaignVariants" scv
          WHERE scv."campaignId" IS NOT DISTINCT FROM $1
        `,
        params: [params.campaignId],
      };
    case "ProductVariant":
      const limit = Math.min(Number(params.limit ?? 1000), 2000);
      return {
        sql: `
          SELECT
            pv.*
          FROM public."ProductVariant" pv
            WHERE pv."productId" IS NOT DISTINCT FROM $1
          LIMIT $2
        `,
        params: [params.productId, limit],
      };

    default:
      throw new Error(`Unknown query key: ${queryKey}`);
  }
}
