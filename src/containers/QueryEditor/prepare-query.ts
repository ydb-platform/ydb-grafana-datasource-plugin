import { AggregationFunctionsMap, dateSelectableParams } from './constants';
import { defaultWrapper, escapeAndWrapString } from './helpers';
import { AggregationType, ExpressionName, FilterType, LogicalOperation, QueryFormat, SqlBuilderOptions } from './types';

const logLevelAlias = 'level';

function getAliasExpression(
  fieldName: string,
  alias: string,
  wrapper = defaultWrapper,
  fieldTransformer?: (field: string, wrapper: string) => string
) {
  let normalizedField = escapeAndWrapString(fieldName, wrapper);
  if (typeof fieldTransformer === 'function') {
    normalizedField = fieldTransformer(fieldName, wrapper);
  }
  return `${normalizedField} AS ${escapeAndWrapString(alias, wrapper)}`;
}

const expressionWithCommaSeparatedParams: ExpressionName[] = ['in', 'notIn', 'between', 'notBetween'];

function splitParams(params: string, paramsType: FilterType['paramsType']) {
  return params.split(',').map((p) => {
    const normalizedParam = p.trim();
    if (paramsType === 'number') {
      const paramToNumber = Number(p);
      if (!isNaN(paramToNumber)) {
        return paramToNumber;
      }
    }
    return escapeAndWrapString(normalizedParam, '"');
  });
}

function prepareSplittedParams(params: string, expr: ExpressionName, paramsType: FilterType['paramsType']) {
  const splittedParams = splitParams(params, paramsType);
  switch (expr) {
    case 'in':
    case 'notIn':
      return `(${splittedParams.join(', ')})`;
    case 'between':
    case 'notBetween':
      return splittedParams.join(' AND ');
  }
  return splittedParams.join(', ');
}

const selectableParamsToSql: Record<keyof typeof dateSelectableParams, string> = {
  dashboardStart: '$__fromTimestamp',
  dashboardEnd: '$__toTimestamp',
};

export function prepareParams({ params, expr, paramsType }: Partial<FilterType>) {
  if (!params || !paramsType) {
    return '';
  }
  if (typeof params === 'number') {
    return params;
  } else if (params in selectableParamsToSql) {
    return selectableParamsToSql[params as keyof typeof selectableParamsToSql];
  } else if (expr && expressionWithCommaSeparatedParams.includes(expr)) {
    return prepareSplittedParams(params, expr, paramsType);
  }
  return escapeAndWrapString(params, '"');
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
  const { logicalOp, column, expr, params } = filter;
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
  if (params) {
    result.push(prepareParams(filter));
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

function checkAndAddLogLevelField(logLevelField: string, fields: string[]) {
  if (!fields.includes(logLevelField)) {
    return [...fields, logLevelField];
  }
  return fields;
}

export function prepareLogLineFields(fields: string[]) {
  const wrappedFields = fields.map(
    (f) => `${escapeAndWrapString(`${f}=`, '"')}||CAST(${escapeAndWrapString(f)} AS string)`
  );
  const lintel = `||${escapeAndWrapString(', ', '"')}||`;
  return wrappedFields.length ? `${wrappedFields.join(lintel)} AS ${escapeAndWrapString('logLine')}` : '';
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
  } = builderOptions;
  const logLineString = queryFormat === 'logs' ? prepareLogLineFields(loglineFields) : '';
  const normalizedFields =
    queryFormat === 'logs' && logLevelField ? checkAndAddLogLevelField(logLevelField, fields) : fields;
  const wrappedSchemaFields = normalizedFields?.map((field) => {
    if (queryFormat === 'logs' && field === logLevelField && field !== logLevelAlias) {
      return getAliasExpression(field, logLevelAlias, defaultWrapper, getFieldToLowerCaseExpression);
    }
    return escapeAndWrapString(field);
  });
  const aggregatedFields = getAggregations(aggregations);

  const fieldsString = [logLineString, ...wrappedSchemaFields, ...aggregatedFields].filter(Boolean).join(', \n');
  const groupByCondition = getGroupBy(groupBy);
  const limitCondition = limit ? ` \nLIMIT ${limit}` : '';
  const whereCondition = getWhereExpression(filters);
  return `SELECT${fieldsString ? ` ${fieldsString}` : ''} \nFROM${
    table ? ` ${escapeAndWrapString(table)}` : ''
  }${whereCondition}${groupByCondition}${limitCondition}`;
}
