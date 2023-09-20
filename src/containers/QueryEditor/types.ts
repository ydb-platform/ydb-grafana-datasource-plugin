import { DataQuery } from '@grafana/schema';
import { AggregationFunctionsMap, ExpressionsMap, SortDirectionsMap } from './constants';
import { primitiveTypes } from './data-types';

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

export interface LogTimeField {
  name: string | null;
  cast?: string | null;
}
export interface SqlBuilderOptionsList {
  table?: string;
  fields?: string[];
  loglineFields?: string[];
  limit?: string | number;
  logLevelField?: string | null;
  logTimeField?: LogTimeField;
  rawSqlBuilder?: string;
  filters?: FilterType[];
  groupBy?: string[];
  aggregations?: AggregationType[];
  orderBy?: OrderByType[];
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
  params?: string[];
  paramsType: 'number' | 'text' | null;
  skipEmpty?: boolean;
};

export type SortDirectionName = keyof typeof SortDirectionsMap;
export type SortDirectionValue = (typeof SortDirectionsMap)[keyof typeof SortDirectionsMap];

export type OrderByType = {
  id: string;
  column?: string;
  sortDirection?: SortDirectionName | null;
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

export type AggregationFunction = keyof typeof AggregationFunctionsMap;
export type AggregationFunctionValue = (typeof AggregationFunctionsMap)[keyof typeof AggregationFunctionsMap];

export type AggregationParams = {
  distinct?: boolean;
};

export type AggregationType = {
  id: string;
  aggregationFunction: AggregationFunction | null;
  column: string;
  alias?: string;
  params: AggregationParams;
};

export type PrimitiveDataType = (typeof primitiveTypes)[number];
