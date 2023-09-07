import { SelectableValue } from '@grafana/data';
import { Select, Button, RadioButtonGroup } from '@grafana/ui';

import { ExpressionsMap, defaultInputWidth, expressionWithMultipleParams } from 'containers/QueryEditor/constants';
import { getSelectableValues } from 'containers/QueryEditor/helpers';
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
};

interface FilterProps {
  filter: FilterType;
  onRemove: VoidFunction;
  onEdit: (value: Partial<FilterType>) => void;
  fields: readonly string[];
  loading?: boolean;
  type: string;
  variables: string[];
}

export function Filter({ onRemove, onEdit, filter, fields, loading, type, variables }: FilterProps) {
  const { column, logicalOp, expr, params = [], paramsType } = filter;
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

  const getSelectableParams = () => {
    const allParams = Array.from(new Set([...variables, ...params]));
    let selectableValues: Array<SelectableValue<string>> = allParams.map((value) => ({
      label: value,
      value: value,
    }));
    return selectableValues;
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
        <ParametersSelect onEdit={onEdit} options={getSelectableParams()} value={params} isMulti={isMultiParams} />
      )}
      <Button icon="trash-alt" onClick={onRemove} title="Remove field" fill="outline" />
    </div>
  );
}

interface ParametersSelectProps {
  onEdit: (value: Partial<FilterType>) => void;
  options: Array<SelectableValue<string>>;
  value: string[];
  isMulti?: boolean;
}

function ParametersSelect({ onEdit, options, value, isMulti }: ParametersSelectProps) {
  const { paramsPlaceholder } = selectors.components.QueryBuilder.Filter;
  const handleChangeMultiParamsSelect = (e: Array<SelectableValue<string>>) => {
    onEdit({ params: e.map((el) => el.value ?? '').filter(Boolean) });
  };
  const handleChangeSingleParamsSelect = (e: SelectableValue<string>) => {
    onEdit({ params: e?.value ? [e.value] : [] });
  };
  if (isMulti) {
    return (
      <Select
        // bug in grafana types. isMulti option is not taken into account
        onChange={handleChangeMultiParamsSelect as any}
        options={options}
        value={value}
        menuPlacement={'bottom'}
        isClearable
        allowCustomValue
        isMulti
        width={defaultInputWidth}
        placeholder={paramsPlaceholder}
      />
    );
  }
  return (
    <Select
      onChange={handleChangeSingleParamsSelect}
      options={options}
      value={value[0]}
      menuPlacement={'bottom'}
      isClearable
      allowCustomValue
      width={defaultInputWidth}
      placeholder={paramsPlaceholder}
    />
  );
}
