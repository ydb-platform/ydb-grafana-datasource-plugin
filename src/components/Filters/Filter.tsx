import { SelectableValue } from '@grafana/data';
import { Select, Button, RadioButtonGroup, Input } from '@grafana/ui';

import { defaultInputWidth } from 'containers/QueryEditor/constants';
import { getSelectableValues } from 'containers/QueryEditor/helpers';
import {
  BooleanExpressions,
  CommonExpressions,
  DateExpressions,
  ExpressionsMap,
  FilterType,
  LogicalOperation,
  StringExpressions,
  ExpressionName,
  LogicalOperationNames,
} from 'containers/QueryEditor/types';
import { isDataTypeBool, isDataTypeDateTime, isDataTypeString } from 'containers/QueryEditor/data-types';

import { styles } from 'styles';

const options: Array<SelectableValue<LogicalOperation>> = [
  { label: LogicalOperationNames['and'], value: 'and' },
  { label: LogicalOperationNames['or'], value: 'or' },
];

function getExpressions(type: string) {
  if (isDataTypeString(type)) {
    return StringExpressions;
  }
  if (isDataTypeDateTime(type)) {
    return DateExpressions;
  }
  if (isDataTypeBool(type)) {
    return BooleanExpressions;
  }
  return CommonExpressions;
}

const expressionsWithNoParams: ExpressionName[] = [
  'null',
  'notNull',
  'insideDashboard',
  'outsideDashboard',
  'isTrue',
  'isFalse',
];
const expressionsWithOnlyStringParam: ExpressionName[] = [
  'in',
  'notIn',
  'between',
  'notBetween',
  'like',
  'notLike',
  'regexp',
];

function getParamsType(type: string, expr?: ExpressionName | null) {
  if (!expr || expressionsWithNoParams.includes(expr)) {
    return null;
  }
  if (isDataTypeString(type) || isDataTypeDateTime(type) || expressionsWithOnlyStringParam.includes(expr)) {
    return 'text';
  }
  return 'number';
}

function getPlaceholder(expr?: ExpressionName | null) {
  if (expr === 'between' || expr === 'notBetween') {
    return 'Enter two values separated by comma';
  }
  if (expr === 'in' || expr === 'notIn') {
    return 'Enter values separated by comma';
  }
  return '';
}

interface FilterProps {
  filter: FilterType;
  onRemove: VoidFunction;
  onEdit: (value: Partial<FilterType>) => void;
  fields: string[];
  loading?: boolean;
  type: string;
}

export function Filter({ onRemove, onEdit, filter, fields, loading, type }: FilterProps) {
  const { column, logicalOp, expr, params } = filter;
  const selectableFields = getSelectableValues(fields);

  const paramsType = getParamsType(type, expr);

  const placeholder = getPlaceholder(expr);

  const expressions = getExpressions(type).map((expr) => ({
    label: ExpressionsMap[expr],
    value: expr,
  }));

  const handleSelectColumn = (value: SelectableValue<string>) => {
    onEdit({ column: value.value, expr: null, params: undefined });
  };
  const handleSelectExpression = (value: SelectableValue<ExpressionName | null>) => {
    onEdit({ expr: value.value });
  };
  const handleChangeLogicalOperation = (value: string) => {
    onEdit({ logicalOp: value as LogicalOperation });
  };
  const handleChangeParams = (e: React.FormEvent<HTMLInputElement>) => {
    if (paramsType === 'number') {
      onEdit({ params: e.currentTarget.valueAsNumber, paramsType });
    } else {
      onEdit({ params: e.currentTarget.value });
    }
  };

  return (
    <div className={styles.Common.grid5}>
      <div>
        {logicalOp && <RadioButtonGroup options={options} value={logicalOp} onChange={handleChangeLogicalOperation} />}
      </div>
      <Select
        onChange={handleSelectColumn}
        options={selectableFields}
        value={column}
        menuPlacement={'bottom'}
        isLoading={loading}
        isSearchable
        width={defaultInputWidth}
        placeholder="Choose column"
      />
      <Select
        onChange={handleSelectExpression}
        options={expressions}
        value={expr}
        menuPlacement={'bottom'}
        isSearchable
        placeholder="Choose expression"
        width={30}
        allowCustomValue={false}
      />
      {paramsType && (
        <Input
          placeholder={placeholder}
          type={paramsType}
          width={defaultInputWidth}
          onChange={handleChangeParams}
          value={params}
        />
      )}
      <Button icon="x" onClick={onRemove} title="Remove field" fill="outline" />
    </div>
  );
}
