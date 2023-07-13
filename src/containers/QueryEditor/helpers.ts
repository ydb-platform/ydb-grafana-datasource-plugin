import { QueryFormat, TableField, TableFieldBackend } from './types';

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

export const defaultWrapper = '`';

const escapeBackticksRe = /[\`]/g;
const escapeDoubleQuotesRe = /[\"]/g;

function escapeString(re: RegExp, st: string) {
  return st && st.replaceAll(re, '\\$&');
}

export function escapeAndWrapString(st = '', wrapper = defaultWrapper) {
  let escapedString = '';
  if (wrapper === '`') {
    escapedString = escapeString(escapeBackticksRe, st);
  } else if (wrapper === '"') {
    escapedString = escapeString(escapeDoubleQuotesRe, st);
  }
  return escapedString && `${wrapper}${escapedString}${wrapper}`;
}

export function normalizeFields(fields: TableFieldBackend[]): TableField[] {
  return fields.map((f) => ({ name: f.Name, type: f.Type }));
}

export function getSelectableValues(fields: string[]) {
  return fields.map((f) => ({ label: f, value: f }));
}
