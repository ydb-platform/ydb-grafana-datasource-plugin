import { AggregationFunctionsMap, expressionWithMultipleParams, panelVariables } from './constants';
import { isDataTypePrimitive } from './data-types';
import { defaultWrapper, escapeAndWrapString } from './helpers';
import {
  AggregationType,
  ExpressionName,
  FilterType,
  LogTimeField,
  LogicalOperation,
  OrderByType,
  PrimitiveDataType,
  QueryFormat,
  SqlBuilderOptions,
} from './types';

const LogLevelAlias = 'level';

interface GetAliasExpressionProps {
  fieldName: string;
  alias?: string;
  wrapper?: string;
  fieldTransformer?: (field: string, wrapper: string) => string;
}

function getAliasExpression({ fieldName, alias, wrapper = defaultWrapper, fieldTransformer }: GetAliasExpressionProps) {
  let normalizedField = escapeAndWrapString(fieldName, wrapper);
  if (typeof fieldTransformer === 'function') {
    normalizedField = fieldTransformer(fieldName, wrapper);
  }
  if (!alias) {
    return normalizedField;
  }
  return `${normalizedField} AS ${escapeAndWrapString(alias, wrapper)}`;
}

const variableRe = /^\${\S+}$/g;

function isVariable(param: string) {
  return panelVariables.includes(param) || param.match(variableRe);
}

function normalizeSingleParameter(param: string, paramsType: FilterType['paramsType']) {
  const normalizedParam = param.trim();
  if (paramsType === 'number') {
    const paramToNumber = Number(param);
    if (!isNaN(paramToNumber)) {
      return paramToNumber;
    }
  }
  if (isVariable(normalizedParam)) {
    return normalizedParam;
  }
  return escapeAndWrapString(normalizedParam, '"');
}

function prepareMultipleParams(params: string[], expr: ExpressionName, paramsType: FilterType['paramsType']) {
  const normalizedParams = params.map((p) => normalizeSingleParameter(p, paramsType));
  switch (expr) {
    case 'in':
    case 'notIn':
      return `(${normalizedParams.join(', ')})`;
    case 'between':
    case 'notBetween':
      return normalizedParams.join(' AND ');
  }
  return normalizedParams.join(', ');
}

export function prepareParams({ params, expr, paramsType }: Partial<FilterType>) {
  if (!paramsType || !params) {
    return undefined;
  }
  if (expr && expressionWithMultipleParams.includes(expr)) {
    return prepareMultipleParams(params, expr, paramsType);
  }
  const preparedParams = params.map((p) => normalizeSingleParameter(p, paramsType));
  return preparedParams.join(', ');
}

export const expressionToSql: Record<ExpressionName, string> = {
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
  insideDashboard: 'BETWEEN $__fromTimestamp AND $__toTimestamp',
  outsideDashboard: 'NOT BETWEEN $__fromTimestamp AND $__toTimestamp',
  isTrue: '== true',
  isFalse: '== false',
};

export const logicalOpToSql: Record<LogicalOperation, string> = {
  and: 'AND',
  or: 'OR',
};

export function getSingleWhereExpression(filter: FilterType) {
  const { logicalOp, column, expr } = filter;
  if (!column) {
    return '';
  }
  const result = [];
  if (logicalOp) {
    result.push(logicalOpToSql[logicalOp]);
  }
  result.push(escapeAndWrapString(column));
  if (expr) {
    result.push(expressionToSql[expr]);
  }
  const preparedParams = prepareParams(filter);
  if (preparedParams !== undefined) {
    result.push(preparedParams);
  }
  return result.join(' ');
}

export function getWhereExpression(filters: FilterType[]) {
  if (filters.length === 0) {
    return '';
  }
  const filtersExpression = filters
    .filter((f) => f.column)
    .map(getSingleWhereExpression)
    .filter(Boolean)
    .join(' \n');
  return filtersExpression ? ` \nWHERE \n${filtersExpression}` : '';
}

interface FieldWithParams {
  name: string;
  alias?: string;
  fieldTransformer?: (field: string, wrapper: string) => string;
}

interface NormalizeFieldsForLogsProps {
  logLevelField?: string | null;
  fields: FieldWithParams[];
  logTimeField?: LogTimeField;
}

function normalizeFieldsForLogs({ logLevelField, fields, logTimeField }: NormalizeFieldsForLogsProps) {
  let normalizedFields = [...fields];
  const logTimeFieldName = logTimeField?.name;
  if (logLevelField) {
    const normalizedLogLevelField: FieldWithParams = {
      name: logLevelField,
      fieldTransformer: getFieldToLowerCaseExpression,
      alias: logLevelField === LogLevelAlias ? '' : LogLevelAlias,
    };
    normalizedFields = normalizedFields.filter((f) => f.name !== logLevelField);
    normalizedFields.push(normalizedLogLevelField);
  }

  if (logTimeFieldName) {
    const isValidCastAs = Boolean(logTimeField.cast && isDataTypePrimitive(logTimeField.cast));
    const normalizedLogTimeField: FieldWithParams = {
      name: logTimeFieldName,
      fieldTransformer: isValidCastAs
        ? (name, wrapper) => prepareCastAs(name, logTimeField.cast as PrimitiveDataType, wrapper)
        : undefined,
    };
    normalizedFields = normalizedFields.filter((f) => f.name !== logTimeFieldName);
    normalizedFields.unshift(normalizedLogTimeField);
  }
  return normalizedFields;
}

function prepareCastAs(fieldName?: string, castAs?: PrimitiveDataType, wrapper = defaultWrapper) {
  if (!fieldName) {
    return '';
  }
  const wrappedFieldName = escapeAndWrapString(fieldName, wrapper);
  if (!castAs) {
    return wrappedFieldName;
  }
  {
    return `CAST(${wrappedFieldName} AS ${castAs})`;
  }
}

export function prepareLogLineFields(fields: string[]) {
  const wrappedFields = fields.map((f) => `${escapeAndWrapString(`${f}=`, '"')}||${prepareCastAs(f, 'String')}`);
  if (!wrappedFields.length) {
    return '';
  }
  const lintel = `||${escapeAndWrapString(', ', '"')}||`;
  return `${wrappedFields.join(lintel)} AS ${escapeAndWrapString('logLine')}`;
}

function getFieldToLowerCaseExpression(field: string, wrapper = defaultWrapper) {
  return `String::AsciiToLower(${escapeAndWrapString(field, wrapper)})`;
}

export function getGroupBy(groupByFields: string[]) {
  if (groupByFields.length === 0) {
    return '';
  }
  return `\n GROUP BY ${groupByFields.map((el) => escapeAndWrapString(el)).join(', ')}`;
}

export function getSingleAggregation(aggregation: AggregationType) {
  const { aggregationFunction, column, params, alias } = aggregation;
  if (!aggregationFunction || !column) {
    return '';
  }
  const distinct = params.distinct ? 'DISTINCT ' : '';
  const aliasExpression = alias ? ` AS ${escapeAndWrapString(alias)}` : '';
  const columnExpression = column === '*' ? column : escapeAndWrapString(column);
  return `${AggregationFunctionsMap[aggregationFunction]}(${distinct}${columnExpression})${aliasExpression}`;
}

export function getAggregations(aggregations: AggregationType[]) {
  return aggregations.map(getSingleAggregation).filter(Boolean);
}

export function getSingleOrderBy(orderBy: OrderByType) {
  const { column, sortDirection } = orderBy;
  if (!column) {
    return;
  }
  return `${escapeAndWrapString(column)} ${sortDirection}`;
}

export function getOrderByCondition(orderBy: OrderByType[]) {
  const preparedFields = orderBy.map(getSingleOrderBy).filter(Boolean);
  if (preparedFields.length === 0) {
    return '';
  }
  return `\n ORDER BY ${preparedFields.join(', ')}`;
}

export function getRawSqlFromBuilderOptions(builderOptions: SqlBuilderOptions, queryFormat: QueryFormat) {
  const {
    logLevelField,
    loglineFields = [],
    fields = [],
    limit,
    filters = [],
    table,
    groupBy = [],
    aggregations = [],
    logTimeField,
    orderBy = [],
  } = builderOptions;
  const isLogs = queryFormat === 'logs';
  const logLineString = isLogs ? prepareLogLineFields(loglineFields) : '';
  const preparedFields: FieldWithParams[] = fields.map((f) => ({ name: f }));
  const normalizedFields = isLogs
    ? normalizeFieldsForLogs({ logLevelField, fields: preparedFields, logTimeField })
    : preparedFields;
  const wrappedSchemaFields = normalizedFields?.map((field) => {
    return getAliasExpression({ fieldName: field.name, fieldTransformer: field.fieldTransformer, alias: field.alias });
  });
  const aggregatedFields = getAggregations(aggregations);

  const fieldsString = [logLineString, ...wrappedSchemaFields, ...aggregatedFields].filter(Boolean).join(', \n');
  const groupByCondition = getGroupBy(groupBy);
  const limitCondition = limit ? ` \nLIMIT ${limit}` : '';
  const whereCondition = getWhereExpression(filters);
  const orderByCondition = getOrderByCondition(orderBy);
  return `SELECT${fieldsString ? ` ${fieldsString}` : ''} \nFROM${
    table ? ` ${escapeAndWrapString(table)}` : ''
  }${whereCondition}${groupByCondition}${orderByCondition}${limitCondition}`;
}
