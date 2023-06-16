import { QueryFormat } from './types';

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
