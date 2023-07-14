import { QueryFormat, YDBBuilderQuery, YDBSQLQuery } from './types';

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

export const defaultSqlEditorHeight = '150px';

export const GrafanaFormClassName = 'gf-form';

export const UnknownFieldType = 'unknown';

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
