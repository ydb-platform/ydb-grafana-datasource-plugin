export const PRIMITIVE_TYPES = {
  BOOL: 'Bool',
  STRING: 'String',
  UTF8: 'Utf8',
  INT8: 'Int8',
  INT16: 'Int16',
  INT32: 'Int32',
  INT64: 'Int64',
  UINT8: 'Uint8',
  UINT16: 'Uint16',
  UINT32: 'Uint32',
  UINT64: 'Uint64',
  FLOAT: 'Float',
  DOUBLE: 'Double',
  DECIMAL: 'Decimal',
  DATE: 'Date',
  DATETIME: 'Datetime',
  TIMESTAMP: 'Timestamp',
  INTERVAL: 'Interval',
  TZ_DATE: 'TzDate',
  TZ_DATETIME: 'TzDatetime',
  TZ_TIMESTAMP: 'TzTimestamp',
  YSON: 'Yson',
  JSON: 'Json',
  UUID: 'Uuid',
  DYNUMBER: 'Dynumber',
  JSON_DOCUMENT: 'JsonDocument',
} as const;

export const notSimpleDataTypes = ['Void', 'Yson', 'Json', 'Null', 'Optional<Yson>', 'Optional<Json>'] as const;
export const numericDataTypes = [
  'Double',
  'Float',
  'Int64',
  'Int32',
  'Int16',
  'Int8',
  'Uint64',
  'Uint32',
  'Uint16',
  'Uint8',
  'Decimal',
  'Optional<Double>',
  'Optional<Float>',
  'Optional<Int64>',
  'Optional<Int32>',
  'Optional<Int16>',
  'Optional<Int8>',
  'Optional<Uint64>',
  'Optional<Uint32>',
  'Optional<Uint16>',
  'Optional<Uint8>',
  'Optional<Decimal>',
] as const;
export const dateTimeDataTypes = [
  'Date',
  'TzDate',
  'Datetime',
  'TzDatetime',
  'Timestamp',
  'TzTimestamp',
  'Interval',
  'Optional<Date>',
  'Optional<TzDate>',
  'Optional<Datetime>',
  'Optional<TzDatetime>',
  'Optional<Timestamp>',
  'Optional<TzTimestamp>',
  'Optional<Interval>',
] as const;
export const stringDataTypes = [
  'String',
  'Utf8',
  'Json',
  'Optional<String>',
  'Optional<Utf8>',
  'Optional<Json>',
] as const;

export function isDataTypeSimple(dataType: string) {
  return (notSimpleDataTypes as unknown as string[]).indexOf(dataType) < 0;
}
export function isDataTypeNumeric(dataType: string) {
  return (numericDataTypes as unknown as string[]).indexOf(dataType) >= 0;
}
export function isDataTypeDateTime(dataType: string) {
  return (dateTimeDataTypes as unknown as string[]).indexOf(dataType) >= 0;
}
export function isDataTypeBool(dataType: string) {
  return dataType === 'Bool' || dataType === 'Optional<Bool>';
}

export function isDataTypeString(dataType: string) {
  return (stringDataTypes as unknown as string[]).indexOf(dataType) >= 0;
}
