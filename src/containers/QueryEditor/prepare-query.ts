import { defaultWrapper, escapeAndWrapString } from './helpers';
import { ExpressionName, FilterType, LogicalOperation, QueryFormat, SqlBuilderOptions } from './types';

const logLevelAlias = 'level';

function getAliasExpression(fieldName: string, alias: string, wrapper = defaultWrapper) {
  return `${escapeAndWrapString(fieldName)} AS ${escapeAndWrapString(alias)}`;
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

export function prepareParams({ params, expr, paramsType }: Partial<FilterType>) {
  if (typeof params === 'number') {
    return params;
  } else {
    if (params && expr && expressionWithCommaSeparatedParams.includes(expr)) {
      return prepareSplittedParams(params, expr, paramsType);
    }
    return escapeAndWrapString(params, '"');
  }
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
  const result = [];
  if (logicalOp) {
    result.push(logicalOpToSql[logicalOp]);
  }
  if (column) {
    result.push(escapeAndWrapString(column));
  }
  if (expr) {
    result.push(expressionToSql[expr]);
  }
  if (params) {
    result.push(prepareParams(filter));
  }
  return result.join(' ');
}

export function getWhereExpression(filters: FilterType[]) {
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

export function getRawSqlFromBuilderOptions(builderOptions: SqlBuilderOptions, queryFormat: QueryFormat) {
  const { logLevelField, fields = [] } = builderOptions;
  const normalizedFields =
    queryFormat === 'logs' && logLevelField ? checkAndAddLogLevelField(logLevelField, fields) : fields;
  const fieldsString = normalizedFields
    ?.map((field) => {
      if (queryFormat === 'logs' && field === builderOptions.logLevelField && field !== logLevelAlias) {
        return getAliasExpression(field, logLevelAlias);
      }
      return escapeAndWrapString(field);
    })
    .join(', ');
  const limitCondition = builderOptions.limit ? ` \nLIMIT ${builderOptions.limit}` : '';
  const whereCondition = builderOptions.filters ? getWhereExpression(builderOptions.filters) : '';
  return `SELECT${fieldsString ? ` ${fieldsString}` : ''} \nFROM${
    builderOptions.table ? ` ${escapeAndWrapString(builderOptions.table)}` : ''
  }${whereCondition}${limitCondition}`;
}
