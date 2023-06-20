import { QueryFormat, SqlBuilderOptions } from './types';

export function ConvertQueryFormatToVisualizationType(format: QueryFormat) {
  switch (format) {
    case 'table':
      return 1;
    case 'timeseries':
      return 0;
    default:
      return 1;
  }
}

const escapeSymbolsRe = /[\`]/g;

function escapeString(st?: string) {
  return st && st.replaceAll(escapeSymbolsRe, '\\$&');
}

function wrapString(st?: string, wrapper = '`') {
  const escapedString = escapeString(st);
  return escapedString && `${wrapper}${escapedString}${wrapper}`;
}

export function getRawSqlFromBuilderOptions(builderOptions: SqlBuilderOptions) {
  const fields = builderOptions.fields?.map((field) => wrapString(field)).join(', ');
  const limitCondition = builderOptions.limit ? ` LIMIT ${builderOptions.limit}` : '';
  return `SELECT ${fields} FROM ${wrapString(builderOptions.table)}${limitCondition}`;
}
