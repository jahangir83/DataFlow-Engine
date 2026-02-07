export interface ExportQuery {
  table: string;
  fields?: string[];
  where?: string;
  orderBy?: string;
  limit?: number;
}

export type SqlStatement = {
  sql: string;
  params?: any[];
};
