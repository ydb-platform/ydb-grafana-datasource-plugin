import { ExpressionName, QueryFormat, YDBBuilderQuery, YDBSQLQuery } from './types';

export const defaultYDBBuilderQuery: Partial<YDBBuilderQuery> = {
  queryType: 'builder',
  rawSql: '',
  builderOptions: {
    fields: [],
    limit: 100,
  },
  queryFormat: 'table',
};
export const defaultYDBSQLQuery: Partial<YDBSQLQuery> = {
  queryType: 'sql',
  rawSql: '',
  queryFormat: 'table',
};

export const defaultLabelWidth = 16;
export const defaultInputWidth = 40;
export const defaultNumberInputWidth = 10;
export const wideInputWidth = 100;

export const QueryFormatNames: Record<QueryFormat, string> = {
  table: 'Table',
  timeseries: 'Time Series',
  logs: 'Logs',
} as const;

export const MONACO_LANGUAGE_SQL = 'sql';

export const defaultSqlEditorHeight = 150;

export const GrafanaFormClassName = 'gf-form';

export const UnknownFieldType = 'unknown';
export const AsteriskFieldType = 'asterisk';

export const ExpressionsMap = {
  like: 'LIKE',
  notLike: 'NOT LIKE',
  regexp: 'REGEXP',
  equals: '=',
  harshEquals: '==',
  notEquals: '!=',
  lessOrGtr: '<>',
  gtr: '>',
  gtrOrEquals: '>=',
  less: '<',
  lessOrEquals: '<=',
  null: 'IS NULL',
  notNull: 'IS NOT NULL',
  between: 'BETWEEN',
  notBetween: 'NOT BETWEEN',
  in: 'IN',
  notIn: 'NOT IN',
  insideDashboard: 'INSIDE DASHBOARD RANGE',
  outsideDashboard: 'OUTSIDE DASHBOARD RANGE',
  isTrue: 'IS TRUE',
  isFalse: 'IS FALSE',
} as const;

export const AggregationFunctionsMap = {
  count: 'COUNT',
  min: 'MIN',
  max: 'MAX',
  sum: 'SUM',
  avg: 'AVG',
  some: 'SOME',
} as const;

export const expressionWithMultipleParams: ExpressionName[] = ['in', 'notIn', 'between', 'notBetween'];

export const panelVariables = ['$__fromTimestamp', '$__toTimestamp'];
