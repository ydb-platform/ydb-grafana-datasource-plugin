import { SelectableValue } from '@grafana/data';
import { Select, Button, RadioButtonGroup, Input, InlineField } from '@grafana/ui';

import {
  ExpressionsMap,
  dateSelectableParams,
  defaultInputWidth,
  expressionsWithNoParams,
} from 'containers/QueryEditor/constants';
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

const expressionsWithOnlyStringParam: ExpressionName[] = [
  'in',
  'notIn',
  'between',
  'notBetween',
  'like',
  'notLike',
  'regexp',
];
const expressionsWithSelectionForDates: ExpressionName[] = [
  'equals',
  'harshEquals',
  'notEquals',
  'lessOrGtr',
  'gtr',
  'gtrOrEquals',
  'less',
  'lessOrEquals',
];

function getParamsType(type: string, expr?: ExpressionName | null) {
  if (!expr || expressionsWithNoParams.includes(expr)) {
    return null;
  }
  if (isDataTypeDateTime(type) && expressionsWithSelectionForDates.includes(expr)) {
    return 'date';
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

const ColumnDependableFields: Record<keyof Omit<FilterType, 'column' | 'id' | 'logicalOp'>, any> = {
  expr: null,
  params: null,
  paramsType: null,
};

interface FilterProps {
  filter: FilterType;
  onRemove: VoidFunction;
  onEdit: (value: Partial<FilterType>) => void;
  fields: readonly string[];
  loading?: boolean;
  type: string;
  validationError?: Partial<Record<keyof FilterType, string>>;
}

export function Filter({ onRemove, onEdit, filter, fields, loading, type, validationError }: FilterProps) {
  const { column, logicalOp, expr, params, paramsType } = filter;
  const selectableFields = getSelectableValues(fields);
  const placeholder = getPlaceholder(expr);

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
  const handleChangeParamsInput = (e: React.FormEvent<HTMLInputElement>) => {
    if (paramsType === 'number') {
      onEdit({ params: e.currentTarget.valueAsNumber });
    } else {
      onEdit({ params: e.currentTarget.value });
    }
  };
  const handleChangeParamsSelect = (e: SelectableValue<string>) => {
    onEdit({ params: e?.value ?? null });
  };

  return (
    <div className={styles.Common.inlineFieldWithAddition}>
      {logicalOp && (
        <InlineField className={styles.Common.logicalOpAbsolutePosition}>
          <RadioButtonGroup size="sm" options={options} value={logicalOp} onChange={handleChangeLogicalOperation} />
        </InlineField>
      )}
      <InlineField error={validationError?.column} invalid={Boolean(validationError?.column)}>
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
      </InlineField>
      <InlineField error={validationError?.expr} invalid={Boolean(validationError?.expr)}>
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
      </InlineField>
      {paramsType === 'date' && (
        <InlineField error={validationError?.params} invalid={Boolean(validationError?.params)}>
          <FilterParametersSelect onChange={handleChangeParamsSelect} value={params} />
        </InlineField>
      )}
      {(paramsType === 'number' || paramsType === 'text') && (
        <InlineField error={validationError?.params} invalid={Boolean(validationError?.params)}>
          <FilterParametersInput
            placeholder={placeholder}
            value={params}
            type={paramsType}
            onChange={handleChangeParamsInput}
          />
        </InlineField>
      )}
      <Button icon="trash-alt" onClick={onRemove} title="Remove field" fill="outline" />
    </div>
  );
}

function getSelectableDateValues(selectedValue?: string | null) {
  const selectableValues: Array<SelectableValue<string>> = Object.entries(dateSelectableParams).map(([key, value]) => ({
    label: value,
    value: key,
  }));
  if (selectedValue && !Object.keys(dateSelectableParams).includes(selectedValue)) {
    selectableValues.push({ label: selectedValue, value: selectedValue });
  }
  return selectableValues;
}

interface FilterParametersSelectProps {
  value?: string | number | null;
  onChange: (e: SelectableValue<string>) => void;
}

function FilterParametersSelect({ onChange, value }: FilterParametersSelectProps) {
  const normalizedValue = typeof value === 'number' ? String(value) : value;
  const selectableDateParams = getSelectableDateValues(normalizedValue);
  return (
    <Select
      onChange={onChange}
      options={selectableDateParams}
      value={normalizedValue}
      menuPlacement={'bottom'}
      isClearable
      allowCustomValue
      width={defaultInputWidth}
    />
  );
}

interface FilterParametersInputProps {
  placeholder?: string;
  value?: string | number | null;
  type: 'text' | 'number';
  onChange: (e: React.FormEvent<HTMLInputElement>) => void;
}

function FilterParametersInput({ placeholder = '', type, onChange, value }: FilterParametersInputProps) {
  const normalizedValue = value === null ? undefined : value;
  return (
    <Input
      placeholder={placeholder}
      type={type}
      width={defaultInputWidth}
      onChange={onChange}
      value={normalizedValue}
    />
  );
}
