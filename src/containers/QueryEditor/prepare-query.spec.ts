import { ExpressionsMap } from './constants';
import {
  expressionToSql,
  getRawSqlFromBuilderOptions,
  getSingleWhereExpression,
  prepareParams,
  prepareLogLineFields,
  getGroupBy,
  getSingleAggregation,
  getOrderByCondition,
} from './prepare-query';
import { AggregationType, ExpressionName, FilterType, LogicalOperations, OrderByType, QueryFormat } from './types';

const baseBuilderOptions = {
  table: 'foo',
  fields: ['bar', 'baz'],
  limit: '10',
  logLevelField: 'baz',
};

describe('should add basic parameters', () => {
  it('should not fail without parameters', () => {
    const builderOptions = {};
    const sql = 'SELECT \nFROM';
    expect(getRawSqlFromBuilderOptions(builderOptions, 'logs')).toBe(sql);
  });
  it('add table', () => {
    const builderOptions = {
      table: 'foo',
    };
    const sql = 'SELECT \nFROM `foo`';
    expect(getRawSqlFromBuilderOptions(builderOptions, 'logs')).toBe(sql);
  });
  it('add one field', () => {
    const builderOptions = {
      fields: ['bar'],
    };
    const sql = 'SELECT `bar` \nFROM';
    expect(getRawSqlFromBuilderOptions(builderOptions, 'logs')).toBe(sql);
  });
  it('add more then one field', () => {
    const builderOptions = {
      fields: ['bar', 'baz', 'fido'],
    };
    const sql = 'SELECT `bar`, \n`baz`, \n`fido` \nFROM';
    expect(getRawSqlFromBuilderOptions(builderOptions, 'logs')).toBe(sql);
  });
});

describe('should properly add log field', () => {
  it('should add log level if query type is "logs"', () => {
    const builderOptions = baseBuilderOptions;
    const sql = 'SELECT `bar`, \nString::AsciiToLower(`baz`) AS `level` \nFROM `foo` \nLIMIT 10';
    expect(getRawSqlFromBuilderOptions(builderOptions, 'logs')).toBe(sql);
  });
  it('should add log level if query type is "logs"', () => {
    const builderOptions = baseBuilderOptions;
    const sql = 'SELECT `bar`, \nString::AsciiToLower(`baz`) AS `level` \nFROM `foo` \nLIMIT 10';
    expect(getRawSqlFromBuilderOptions(builderOptions, 'logs')).toBe(sql);
  });
  it('should add log level if query type is "logs" and field is not in selected', () => {
    const builderOptions = { ...baseBuilderOptions, fields: ['bar'] };
    const sql = 'SELECT `bar`, \nString::AsciiToLower(`baz`) AS `level` \nFROM `foo` \nLIMIT 10';
    expect(getRawSqlFromBuilderOptions(builderOptions, 'logs')).toBe(sql);
  });
  for (const type of ['table', 'timeseries']) {
    it(`should not add log level if query type is ${type}`, () => {
      const builderOptions = baseBuilderOptions;
      const sql = 'SELECT `bar`, \n`baz` \nFROM `foo` \nLIMIT 10';
      expect(getRawSqlFromBuilderOptions(builderOptions, type as QueryFormat)).toBe(sql);
    });
  }
});

describe('should properly add log time field', () => {
  it('should add log time as first fields if query type is "logs"', () => {
    const builderOptions = {
      table: 'foo',
      fields: ['bar', 'baz'],
      limit: '10',
      logTimeField: { name: 'baz' },
    };
    const sql = 'SELECT `baz`, \n`bar` \nFROM `foo` \nLIMIT 10';
    expect(getRawSqlFromBuilderOptions(builderOptions, 'logs')).toBe(sql);
  });
  it('should add log time with cast as first fields if query type is "logs"', () => {
    const builderOptions = {
      table: 'foo',
      fields: ['bar', 'baz'],
      limit: '10',
      logTimeField: { name: 'baz', cast: 'Datetime' },
    };
    const sql = 'SELECT CAST(`baz` AS Datetime), \n`bar` \nFROM `foo` \nLIMIT 10';
    expect(getRawSqlFromBuilderOptions(builderOptions, 'logs')).toBe(sql);
  });
});

describe('should properly add logline field', () => {
  it('should add log line if query type is "logs"', () => {
    const builderOptionsWithLogline = { ...baseBuilderOptions, loglineFields: ['foo', 'bar'] };
    const sql =
      'SELECT "foo="||CAST(`foo` AS String)||", "||"bar="||CAST(`bar` AS String) AS `logLine`, \n`bar`, \nString::AsciiToLower(`baz`) AS `level` \nFROM `foo` \nLIMIT 10';
    expect(getRawSqlFromBuilderOptions(builderOptionsWithLogline, 'logs')).toBe(sql);
  });
  it('should add log line if query type is "logs" and logline field is not in selected', () => {
    const sql = 'SELECT `bar`, \nString::AsciiToLower(`baz`) AS `level` \nFROM `foo` \nLIMIT 10';
    expect(getRawSqlFromBuilderOptions(baseBuilderOptions, 'logs')).toBe(sql);
  });
  for (const type of ['table', 'timeseries']) {
    const builderOptionsWithLogline = { ...baseBuilderOptions, loglineFields: ['foo', 'bar'] };
    it(`should not add log line if query type is ${type}`, () => {
      const sql = 'SELECT `bar`, \n`baz` \nFROM `foo` \nLIMIT 10';
      expect(getRawSqlFromBuilderOptions(builderOptionsWithLogline, type as QueryFormat)).toBe(sql);
    });
  }
});

describe('should properly add WHERE condition', () => {
  it('do not add WHERE condition without params', () => {
    const builderOptions = { ...baseBuilderOptions, filters: [] };
    const sql = 'SELECT `bar`, \n`baz` \nFROM `foo` \nLIMIT 10';
    expect(getRawSqlFromBuilderOptions(builderOptions, 'table')).toBe(sql);
  });

  it('add WHERE condition with params', () => {
    const builderOptions = {
      ...baseBuilderOptions,
      filters: [
        {
          id: '1',
          column: 'bar',
          expr: 'gtr',
          params: ['foo', 'bar', 'baz', '1   '],
          paramsType: 'number',
        },
        {
          id: '1',
          column: 'bar',
          logicalOp: 'and',
          expr: 'gtr',
          params: ['foo', 'bar', 'baz', '1   '],
          paramsType: 'number',
        },
      ] as FilterType[],
    };
    const sql = 'SELECT `bar`, \n`baz` \nFROM `foo` \nWHERE \n`bar` > "foo" \nAND `bar` > "foo" \nLIMIT 10';
    expect(getRawSqlFromBuilderOptions(builderOptions, 'table')).toBe(sql);
  });
});

describe('should properly generate single WHERE condition', () => {
  it('without params', () => {
    const filter: FilterType = { id: '1', paramsType: null };
    const sql = '';
    expect(getSingleWhereExpression(filter)).toBe(sql);
  });
  it('with only column', () => {
    const filter: FilterType = { id: '1', column: 'bar', paramsType: null };
    const sql = '';
    expect(getSingleWhereExpression(filter)).toBe(sql);
  });
  for (const op of LogicalOperations) {
    it(`with column and logical op ${op}`, () => {
      const filter: FilterType = { id: '1', column: 'bar', logicalOp: op, paramsType: null };
      const sql = '';
      expect(getSingleWhereExpression(filter)).toBe(sql);
    });
  }
  it('with logical op and zero parameter', () => {
    const filter: FilterType = { id: '1', column: 'bar', paramsType: 'number', params: ['0'], expr: 'equals' };
    const sql = '`bar` = 0';
    expect(getSingleWhereExpression(filter)).toBe(sql);
  });
  for (const expr of Object.keys(ExpressionsMap)) {
    it(`with column, logical op and expression ${expr}`, () => {
      const filter: FilterType = {
        id: '1',
        column: 'bar',
        logicalOp: 'and',
        expr: expr as ExpressionName,
        paramsType: null,
      };
      const sql = `AND \`bar\` ${expressionToSql[expr as ExpressionName]}`;
      expect(getSingleWhereExpression(filter)).toBe(sql);
    });
  }
  for (const expr of Object.keys(ExpressionsMap)) {
    const typedExpr = expr as ExpressionName;
    it(`with column, logical op, expression ${typedExpr} and mixed params without skipEmpty`, () => {
      let sql = `AND \`bar\` ${expressionToSql[typedExpr]} "foo"`;
      switch (typedExpr) {
        case 'in':
        case 'notIn':
          sql = `AND \`bar\` ${expressionToSql[typedExpr]} ("foo", "bar", "baz", 1)`;
          break;
        case 'between':
        case 'notBetween':
          sql = `AND \`bar\` ${expressionToSql[typedExpr]} "foo" AND "bar" AND "baz" AND 1`;
          break;
        case 'isFalse':
        case 'isTrue':
        case 'insideDashboard':
        case 'outsideDashboard':
        case 'null':
        case 'notNull':
          sql = `AND \`bar\` ${expressionToSql[typedExpr]}`;
          break;
      }
      const filter: FilterType = {
        id: '1',
        column: 'bar',
        logicalOp: 'and',
        expr: typedExpr,
        params: ['foo', 'bar', 'baz', '1   '],
        paramsType: 'number',
      };
      expect(getSingleWhereExpression(filter)).toBe(sql);
    });
    it(`with column, logical op, expression ${typedExpr} and mixed params with skipEmpty`, () => {
      let sql = `AND IF(\"\${myVar:text}\" == "", true, \`bar\` ${expressionToSql[typedExpr]} \${myVar})`;
      switch (typedExpr) {
        case 'in':
        case 'notIn':
          sql = `AND IF(\"\${myVar:text}\" == "", true, \`bar\` ${expressionToSql[typedExpr]} (\${myVar}))`;
          break;
        case 'between':
        case 'notBetween':
          sql = `AND IF(\"\${myVar:text}\" == "", true, \`bar\` ${expressionToSql[typedExpr]} \${myVar})`;
          break;
        case 'isFalse':
        case 'isTrue':
        case 'insideDashboard':
        case 'outsideDashboard':
        case 'null':
        case 'notNull':
          sql = `AND \`bar\` ${expressionToSql[typedExpr]}`;
          break;
      }
      const filter: FilterType = {
        id: '1',
        column: 'bar',
        logicalOp: 'and',
        expr: typedExpr,
        params: ['${myVar}'],
        paramsType: 'number',
        skipEmpty: true,
      };
      expect(getSingleWhereExpression(filter)).toBe(sql);
    });
  }
});

describe('should properly generate params of the expression', () => {
  it('with empty params', () => {
    const params: string[] = [];
    const sql = undefined;
    expect(prepareParams({ params })).toBe(sql);
  });
  for (const expr of Object.keys(ExpressionsMap)) {
    it(`with number parameter ${expr}`, () => {
      const params = ['1'];
      let sql = '1';
      switch (expr) {
        case 'in':
        case 'notIn':
          sql = '(1)';
          break;
      }
      expect(prepareParams({ params, expr: expr as ExpressionName, paramsType: 'number' })).toBe(sql);
    });
  }
  for (const expr of Object.keys(ExpressionsMap)) {
    const typedExpr = expr as ExpressionName;
    it(`with single string parameter ${expr}`, () => {
      const params = ['abc'];
      let sql = '"abc"';
      switch (typedExpr) {
        case 'in':
        case 'notIn':
          sql = '("abc")';
          break;
      }
      expect(prepareParams({ params, expr: typedExpr, paramsType: 'text' })).toBe(sql);
    });
  }
  for (const expr of Object.keys(ExpressionsMap)) {
    const typedExpr = expr as ExpressionName;
    it(`with single variable parameter ${expr}`, () => {
      const params = ['${myVar}'];
      let sql = '${myVar}';
      switch (typedExpr) {
        case 'in':
        case 'notIn':
          sql = '(${myVar})';
          break;
      }
      expect(prepareParams({ params, expr: typedExpr, paramsType: 'text' })).toBe(sql);
    });
  }
  for (const expr of Object.keys(ExpressionsMap)) {
    const typedExpr = expr as ExpressionName;
    it(`with multiple string parameter ${expr}`, () => {
      const params = ['foo', 'bar', 'baz'];
      let sql = '"foo"';
      switch (typedExpr) {
        case 'in':
        case 'notIn':
          sql = '("foo", "bar", "baz")';
          break;
        case 'between':
        case 'notBetween':
          sql = '"foo" AND "bar" AND "baz"';
          break;
      }
      expect(prepareParams({ params, expr: typedExpr, paramsType: 'text' })).toBe(sql);
    });
  }
  for (const expr of Object.keys(ExpressionsMap)) {
    const typedExpr = expr as ExpressionName;
    it(`with single number parameter ${expr}`, () => {
      const params = ['1'];
      let sql = '1';
      switch (typedExpr) {
        case 'in':
        case 'notIn':
          sql = '(1)';
          break;
      }
      expect(prepareParams({ params, expr: typedExpr, paramsType: 'number' })).toBe(sql);
    });
  }
  for (const expr of Object.keys(ExpressionsMap)) {
    const typedExpr = expr as ExpressionName;
    it(`with multiple number parameter ${expr}`, () => {
      const params = ['1', '2', '3 '];
      let sql = '1';
      switch (typedExpr) {
        case 'in':
        case 'notIn':
          sql = '(1, 2, 3)';
          break;
        case 'between':
        case 'notBetween':
          sql = '1 AND 2 AND 3';
      }
      expect(prepareParams({ params, expr: typedExpr, paramsType: 'number' })).toBe(sql);
    });
  }
  for (const expr of Object.keys(ExpressionsMap)) {
    const typedExpr = expr as ExpressionName;
    it(`with multiple mixed parameter ${expr}`, () => {
      const params = ['1', '2', 'bar', '3 ', '${myVar}'];
      let sql = '1';
      switch (typedExpr) {
        case 'in':
        case 'notIn':
          sql = '(1, 2, "bar", 3, ${myVar})';
          break;
        case 'between':
        case 'notBetween':
          sql = '1 AND 2 AND "bar" AND 3 AND ${myVar}';
      }
      expect(prepareParams({ params, expr: typedExpr, paramsType: 'number' })).toBe(sql);
    });
  }
});

describe('should properly generate log line', () => {
  it('with empty params', () => {
    const fields: string[] = [];
    const sql = '';
    expect(prepareLogLineFields(fields)).toBe(sql);
  });
  it('with fields', () => {
    const fields = ['foo', 'bar'];
    const sql = '"foo="||CAST(`foo` AS String)||", "||"bar="||CAST(`bar` AS String) AS `logLine`';
    expect(prepareLogLineFields(fields)).toBe(sql);
  });
  it('with fields and logTimeField', () => {
    const fields = ['foo', 'bar', 'fido'];
    const logTimeField = { name: 'fido', cast: 'Timestamp' };
    const sql =
      '"foo="||CAST(`foo` AS String)||", "||"bar="||CAST(`bar` AS String)||", "||"fido="||CAST(CAST(`fido` AS Timestamp) AS String) AS `logLine`';
    expect(prepareLogLineFields(fields, logTimeField)).toBe(sql);
  });
});
describe('should properly generate groupBy', () => {
  it('with empty params', () => {
    const fields: string[] = [];
    const sql = '';
    expect(getGroupBy(fields)).toBe(sql);
  });
  it('with fields', () => {
    const fields = ['foo', 'bar'];
    const sql = '\n GROUP BY `foo`, `bar`';
    expect(getGroupBy(fields)).toBe(sql);
  });
});

describe('should properly generate orderBy', () => {
  it('with empty params', () => {
    const orderBy: OrderByType[] = [];
    const sql = '';
    expect(getOrderByCondition(orderBy)).toBe(sql);
  });
  it('without column', () => {
    const orderBy: OrderByType[] = [{ column: '', sortDirection: 'ASC', id: '1' }];
    const sql = '';
    expect(getOrderByCondition(orderBy)).toBe(sql);
  });
  it('with params', () => {
    const orderBy: OrderByType[] = [
      { column: 'foo', sortDirection: 'ASC', id: '1' },
      { column: 'bar', sortDirection: 'DESC', id: '2' },
    ];
    const sql = '\n ORDER BY `foo` ASC, `bar` DESC';
    expect(getOrderByCondition(orderBy)).toBe(sql);
  });
});
describe('should properly add limit', () => {
  it('add number limit', () => {
    const builderOptions = {
      limit: '10',
    };
    const sql = 'SELECT \nFROM \nLIMIT 10';
    expect(getRawSqlFromBuilderOptions(builderOptions, 'logs')).toBe(sql);
  });
  it('add invalid limit', () => {
    const builderOptions = {
      limit: 'any',
    };
    const sql = 'SELECT \nFROM';
    expect(getRawSqlFromBuilderOptions(builderOptions, 'logs')).toBe(sql);
  });
  it('add variable limit', () => {
    const builderOptions = {
      limit: '${var:sql}',
    };
    const sql = 'SELECT \nFROM \nLIMIT CAST(${var:sql} AS Uint16)';
    expect(getRawSqlFromBuilderOptions(builderOptions, 'logs')).toBe(sql);
  });
});

describe('should properly generate single aggregation', () => {
  it('without columns', () => {
    const aggregation: AggregationType = {
      aggregationFunction: 'count',
      alias: 'bar',
      params: {},
      id: '1',
      column: '',
    };
    const sql = '';
    expect(getSingleAggregation(aggregation)).toBe(sql);
  });
  it('without aggregation function', () => {
    const aggregation: AggregationType = {
      aggregationFunction: null,
      alias: 'bar',
      params: {},
      id: '1',
      column: 'bar',
    };
    const sql = '';
    expect(getSingleAggregation(aggregation)).toBe(sql);
  });
  it('with * as column', () => {
    const aggregation: AggregationType = {
      aggregationFunction: 'count',
      params: {},
      id: '1',
      column: '*',
    };
    const sql = 'COUNT(*)';
    expect(getSingleAggregation(aggregation)).toBe(sql);
  });
  it('with normal column', () => {
    const aggregation: AggregationType = {
      aggregationFunction: 'count',
      params: {},
      id: '1',
      column: 'bar',
    };
    const sql = 'COUNT(`bar`)';
    expect(getSingleAggregation(aggregation)).toBe(sql);
  });
  it('with distinct', () => {
    const aggregation: AggregationType = {
      aggregationFunction: 'count',
      params: { distinct: true },
      id: '1',
      column: 'bar',
    };
    const sql = 'COUNT(DISTINCT `bar`)';
    expect(getSingleAggregation(aggregation)).toBe(sql);
  });
  it('with alias', () => {
    const aggregation: AggregationType = {
      aggregationFunction: 'count',
      params: {},
      alias: 'foo',
      id: '1',
      column: 'bar',
    };
    const sql = 'COUNT(`bar`) AS `foo`';
    expect(getSingleAggregation(aggregation)).toBe(sql);
  });
});
