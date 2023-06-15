import { YDBBuilderQuery, YDBSQLQuery } from './types';

export const defaultYDBBuilderQuery: Partial<YDBBuilderQuery> = {
  queryType: 'builder',
  rawSql: '',
  builderOptions: {
    fields: [],
    limit: 100,
  },
};
export const defaultYDBSQLQuery: Partial<YDBSQLQuery> = {
  queryType: 'sql',
  rawSql: '',
};

export const defaultLabelWidth = 14;
export const defaultInputWidth = 40;
