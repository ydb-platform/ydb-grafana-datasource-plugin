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