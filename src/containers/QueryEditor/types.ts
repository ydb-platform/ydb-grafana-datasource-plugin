import { DataQuery } from '@grafana/schema';

export interface OnChangeQueryAttribute<T> {
  (arg: Partial<T>): void;
}

export const QueryTypes = {
  SQL: 'sql',
  Builder: 'builder',
} as const;

export type QueryType = (typeof QueryTypes)[keyof typeof QueryTypes];

export interface YDBQueryBase extends DataQuery {
  rawSql: string;
  builderOptions: SqlBuilderOptions;
  queryFormat: QueryFormat;
  meta?: {
    timezone?: string;
  };
}

export interface YDBSQLQuery extends YDBQueryBase {
  queryType: typeof QueryTypes.SQL;
}

export interface YDBBuilderQuery extends YDBQueryBase {
  queryType: typeof QueryTypes.Builder;
}

export type YDBQuery = YDBSQLQuery | YDBBuilderQuery;

export interface TableFieldBackend {
  Name: string;
  Type: string;
}

export interface TableField {
  name: string;
  type?: string;
}

export interface SqlBuilderOptionsList {
  table?: string;
  fields?: string[];
  limit?: number;
  timeField?: string;
  logLevelField?: string;
}

export type SqlBuilderOptions = SqlBuilderOptionsList;

export type QueryFormat = 'table' | 'timeseries' | 'logs';
