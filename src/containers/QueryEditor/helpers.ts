import { QueryFormat, SqlBuilderOptions, TableField, TableFieldBackend } from './types';

export function ConvertQueryFormatToVisualizationType(format: QueryFormat) {
  switch (format) {
    case 'table':
      return 1;
    case 'timeseries':
      return 0;
    case 'logs':
      return 2;
    default:
      return 1;
  }
}

const defaultWrapper = '`';
const logLevelAlias = 'level';

const escapeSymbolsRe = /[\`]/g;

function escapeString(st?: string) {
  return st && st.replaceAll(escapeSymbolsRe, '\\$&');
}

function wrapString(st?: string, wrapper = defaultWrapper) {
  const escapedString = escapeString(st);
  return escapedString && `${wrapper}${escapedString}${wrapper}`;
}

function getAliasExpression(fieldName: string, alias: string, wrapper = defaultWrapper) {
  return `${wrapString(fieldName)} as ${wrapString(alias)}`;
}

export function getRawSqlFromBuilderOptions(builderOptions: SqlBuilderOptions, queryFormat: QueryFormat) {
  const fields = builderOptions.fields
    ?.map((field) => {
      if (queryFormat === 'logs' && field === builderOptions.logLevelField && field !== logLevelAlias) {
        return getAliasExpression(field, logLevelAlias);
      }
      return wrapString(field);
    })
    .join(', ');
  const limitCondition = builderOptions.limit ? ` LIMIT ${builderOptions.limit}` : '';
  return `SELECT ${fields} FROM ${wrapString(builderOptions.table)}${limitCondition}`;
}

export function normalizeFields(fields: TableFieldBackend[]): TableField[] {
  return fields.map((f) => ({ name: f.Name, type: f.Type }));
}
