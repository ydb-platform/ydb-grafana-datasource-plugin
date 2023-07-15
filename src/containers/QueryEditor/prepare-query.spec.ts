import { ExpressionsMap } from './constants';
import {
  expressionToSql,
  getRawSqlFromBuilderOptions,
  getSingleWhereExpression,
  logicalOpToSql,
  prepareParams,
  prepareLogLineFields,
} from './prepare-query';
import { ExpressionName, FilterType, LogicalOperations, QueryFormat } from './types';

const baseBuilderOptions = {
  table: 'foo',
  fields: ['bar', 'baz'],
  limit: 10,
  logLevelField: 'baz',
};

describe('should add basic parameters', () => {
  it('should not fail without parameters', () => {
    const builderOptions = {};
    const sql = 'SELECT \nFROM';
    expect(getRawSqlFromBuilderOptions(builderOptions, 'logs')).toBe(sql);
  });
  it('add limit', () => {
    const builderOptions = {
      limit: 10,
    };
    const sql = 'SELECT \nFROM \nLIMIT 10';
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
    const sql = 'SELECT `bar`, \n`baz` AS `level` \nFROM `foo` \nLIMIT 10';
    expect(getRawSqlFromBuilderOptions(builderOptions, 'logs')).toBe(sql);
  });
  it('should add log level if query type is "logs" and field is not in selected', () => {
    const builderOptions = { ...baseBuilderOptions, fields: ['bar'] };
    const sql = 'SELECT `bar`, \n`baz` AS `level` \nFROM `foo` \nLIMIT 10';
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

describe('should properly add logline field', () => {
  it('should add log line if query type is "logs"', () => {
    const builderOptionsWithLogline = { ...baseBuilderOptions, loglineFields: ['foo', 'bar'] };
    const sql =
      'SELECT "foo="||CAST(`foo` AS string)||", "||"bar="||CAST(`bar` AS string) AS `logLine`, \n`bar`, \n`baz` AS `level` \nFROM `foo` \nLIMIT 10';
    expect(getRawSqlFromBuilderOptions(builderOptionsWithLogline, 'logs')).toBe(sql);
  });
  it('should add log line if query type is "logs" and logline field is not in selected', () => {
    const sql = 'SELECT `bar`, \n`baz` AS `level` \nFROM `foo` \nLIMIT 10';
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

  it('add WHERE condition without params', () => {
    const builderOptions = {
      ...baseBuilderOptions,
      filters: [
        {
          id: '1',
          column: 'bar',
          expr: 'gtr',
          params: 'foo, bar, baz, 1  ',
          paramsType: 'number',
        },
        {
          id: '1',
          column: 'bar',
          logicalOp: 'and',
          expr: 'gtr',
          params: 'foo, bar, baz, 1  ',
          paramsType: 'number',
        },
      ] as FilterType[],
    };
    const sql =
      'SELECT `bar`, \n`baz` \nFROM `foo` \nWHERE \n`bar` > "foo, bar, baz, 1  " \nAND `bar` > "foo, bar, baz, 1  " \nLIMIT 10';
    expect(getRawSqlFromBuilderOptions(builderOptions, 'table')).toBe(sql);
  });
});

describe('should properly generate single WHERE condition', () => {
  it('without params', () => {
    const filter: FilterType = { id: '1' };
    const sql = '';
    expect(getSingleWhereExpression(filter)).toBe(sql);
  });
  it('with only column', () => {
    const filter: FilterType = { id: '1', column: 'bar' };
    const sql = '`bar`';
    expect(getSingleWhereExpression(filter)).toBe(sql);
  });
  for (const op of LogicalOperations) {
    it(`with column and logical op ${op}`, () => {
      const filter: FilterType = { id: '1', column: 'bar', logicalOp: op };
      const sql = `${logicalOpToSql[op]} \`bar\``;
      expect(getSingleWhereExpression(filter)).toBe(sql);
    });
  }
  for (const expr of Object.keys(ExpressionsMap)) {
    it(`with column, logical op and expression ${expr}`, () => {
      const filter: FilterType = { id: '1', column: 'bar', logicalOp: 'and', expr: expr as ExpressionName };
      const sql = `AND \`bar\` ${expressionToSql[expr as ExpressionName]}`;
      expect(getSingleWhereExpression(filter)).toBe(sql);
    });
  }
  for (const expr of Object.keys(ExpressionsMap)) {
    const typedExpr = expr as ExpressionName;
    it(`with column, logical op, expression ${typedExpr} and mixed params`, () => {
      let sql = `AND \`bar\` ${expressionToSql[typedExpr]} "foo, bar, baz, 1  "`;
      switch (typedExpr) {
        case 'in':
        case 'notIn':
          sql = `AND \`bar\` ${expressionToSql[typedExpr]} ("foo", "bar", "baz", 1)`;
          break;
        case 'between':
        case 'notBetween':
          sql = `AND \`bar\` ${expressionToSql[typedExpr]} "foo" AND "bar" AND "baz" AND 1`;
          break;
      }
      const filter: FilterType = {
        id: '1',
        column: 'bar',
        logicalOp: 'and',
        expr: typedExpr,
        params: 'foo, bar, baz, 1  ',
        paramsType: 'number',
      };
      expect(getSingleWhereExpression(filter)).toBe(sql);
    });
  }
});

describe('should properly generate params of the expression', () => {
  it('with empty params', () => {
    const params = '';
    const sql = '';
    expect(prepareParams({ params })).toBe(sql);
  });
  for (const expr of Object.keys(ExpressionsMap)) {
    it(`with number parameter ${expr}`, () => {
      const params = 1;
      const sql = 1;
      expect(prepareParams({ params, expr: expr as ExpressionName })).toBe(sql);
    });
  }
  for (const expr of Object.keys(ExpressionsMap)) {
    const typedExpr = expr as ExpressionName;
    it(`with single string parameter ${expr}`, () => {
      const params = 'abc';
      let sql = '"abc"';
      switch (typedExpr) {
        case 'in':
        case 'notIn':
          sql = '("abc")';
          break;
      }
      expect(prepareParams({ params, expr: typedExpr })).toBe(sql);
    });
  }
  for (const expr of Object.keys(ExpressionsMap)) {
    const typedExpr = expr as ExpressionName;
    it(`with multiple string parameter ${expr}`, () => {
      const params = 'foo, bar, baz';
      let sql = '"foo, bar, baz"';
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
      expect(prepareParams({ params, expr: typedExpr })).toBe(sql);
    });
  }
  for (const expr of Object.keys(ExpressionsMap)) {
    const typedExpr = expr as ExpressionName;
    it(`with single number parameter ${expr}`, () => {
      const params = 1;
      let sql = 1;
      expect(prepareParams({ params, expr: typedExpr })).toBe(sql);
    });
  }
  for (const expr of Object.keys(ExpressionsMap)) {
    const typedExpr = expr as ExpressionName;
    it(`with multiple number parameter ${expr}`, () => {
      const params = '1, 2 , 3 ';
      let sql = '"1, 2 , 3 "';
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
      const params = '1, 2 ,bar,  3 ';
      let sql = '"1, 2 ,bar,  3 "';
      switch (typedExpr) {
        case 'in':
        case 'notIn':
          sql = '(1, 2, "bar", 3)';
          break;
        case 'between':
        case 'notBetween':
          sql = '1 AND 2 AND "bar" AND 3';
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
    const sql = '"foo="||CAST(`foo` AS string)||", "||"bar="||CAST(`bar` AS string) AS `logLine`';
    expect(prepareLogLineFields(fields)).toBe(sql);
  });
});
