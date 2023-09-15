import { SelectableValue } from '@grafana/data';
import { Select, Button, RadioButtonGroup, InlineSwitch } from '@grafana/ui';

import { SelectWithVariables } from 'components/SelectWithVariables';

import { ExpressionsMap, defaultInputWidth, expressionWithMultipleParams } from 'containers/QueryEditor/constants';
import { getSelectableValues, isFilterFallbackAvailable } from 'containers/QueryEditor/helpers';
import {
  BooleanExpressions,
  CommonExpressions,
  DateExpressions,
  FilterType,
  LogicalOperation,
  StringExpressions,
  ExpressionName,
  LogicalOperationNames,
} from 'containers/QueryEditor/types';
import { isDataTypeBool, isDataTypeDateTime, isDataTypeString } from 'containers/QueryEditor/data-types';

import { styles } from 'styles';
import { selectors } from 'selectors';

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

function getParamsType(type: string, expr?: ExpressionName | null) {
  if (!expr || expressionsWithNoParams.includes(expr)) {
    return null;
  }
  if (isDataTypeString(type) || isDataTypeDateTime(type)) {
    return 'text';
  }
  return 'number';
}

const ColumnDependableFields: Record<keyof Omit<FilterType, 'column' | 'id' | 'logicalOp'>, any> = {
  expr: null,
  params: undefined,
  paramsType: null,
  skipEmpty: true,
};

interface FilterProps {
  filter: FilterType;
  onRemove: VoidFunction;
  onEdit: (value: Partial<FilterType>) => void;
  fields: readonly string[];
  loading?: boolean;
  type: string;
}

export function Filter({ onRemove, onEdit, filter, fields, loading, type }: FilterProps) {
  const { column, logicalOp, expr, params = [], paramsType, skipEmpty } = filter;
  const selectableFields = getSelectableValues(fields);

  const expressions = getExpressions(type).map((expr) => ({
    label: ExpressionsMap[expr],
    value: expr,
  }));
  const handleSelectColumn = (value: SelectableValue<string>) => {
    onEdit({ column: value.value, ...ColumnDependableFields });
  };
  const handleSelectExpression = (value: SelectableValue<ExpressionName | null>) => {
    const newParamsType = getParamsType(type, value?.value);
    onEdit({ expr: value?.value, paramsType: newParamsType });
  };
  const handleChangeLogicalOperation = (value: string) => {
    onEdit({ logicalOp: value as LogicalOperation });
  };
  const handleParamsChange = (value: string[]) => {
    onEdit({ params: value });
  };
  const handleSkipEmptyChange = (e: React.FormEvent<HTMLInputElement>) => {
    onEdit({ skipEmpty: e.currentTarget.checked });
  };
  const isMultiParams = expressionWithMultipleParams.some((el) => el === expr);

  return (
    <div className={styles.Common.grid5}>
      {logicalOp && (
        <RadioButtonGroup
          size="sm"
          options={options}
          value={logicalOp}
          onChange={handleChangeLogicalOperation}
          className={styles.Common.logicalOpAbsolutePosition}
        />
      )}
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
        <SelectWithVariables
          onChange={handleParamsChange}
          value={params}
          isMulti={isMultiParams}
          placeholder={selectors.components.QueryBuilder.Filter.paramsPlaceholder}
        />
      )}
      {expr && params?.length && isFilterFallbackAvailable({ expr, params }) && (
        <InlineSwitch
          label={selectors.components.QueryBuilder.Filter.EmptyCondition.label}
          showLabel={true}
          value={skipEmpty}
          onChange={handleSkipEmptyChange}
        />
      )}
      <Button icon="trash-alt" onClick={onRemove} title="Remove field" fill="outline" variant="secondary" />
    </div>
  );
}
