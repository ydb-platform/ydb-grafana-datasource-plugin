import { DataQuery } from '@grafana/schema';
import { ExpressionsMap } from './constants';

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
  loglineFields?: string[];
  limit?: number;
  logLevelField?: string | null;
  rawSqlBuilder?: string;
  filters?: FilterType[];
}

export type SqlBuilderOptions = SqlBuilderOptionsList;

export type QueryFormat = 'table' | 'timeseries' | 'logs';

export const LogicalOperations = ['and', 'or'] as const;

export type LogicalOperation = (typeof LogicalOperations)[number];

export const LogicalOperationNames: Record<LogicalOperation, string> = {
  and: 'AND',
  or: 'OR',
};

export type FilterType = {
  id: string;
  logicalOp?: LogicalOperation;
  column?: string;
  expr?: ExpressionName | null;
  params?: string | number;
  paramsType?: 'number';
};

export type ExpressionName = keyof typeof ExpressionsMap;
export type ExpressionValue = (typeof ExpressionsMap)[keyof typeof ExpressionsMap];

export const CommonExpressions: ExpressionName[] = [
  'equals',
  'harshEquals',
  'notEquals',
  'lessOrGtr',
  'gtr',
  'gtrOrEquals',
  'less',
  'lessOrEquals',
  'null',
  'notNull',
  'between',
  'notBetween',
  'in',
  'notIn',
];

export const StringExpressions: ExpressionName[] = ['like', 'notLike', 'regexp', ...CommonExpressions];

export const DateExpressions: ExpressionName[] = ['insideDashboard', 'outsideDashboard', ...CommonExpressions];
export const BooleanExpressions: ExpressionName[] = ['null', 'notNull', 'isTrue', 'isFalse'];

export type Expression = (typeof ExpressionsMap)[keyof typeof ExpressionsMap];
