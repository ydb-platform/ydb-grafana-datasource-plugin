import { SelectableValue } from '@grafana/data';
import { Select, Button, Input, InlineSwitch, InlineField } from '@grafana/ui';

import { AggregationFunctionsMap, AsteriskFieldType, defaultInputWidth } from 'containers/QueryEditor/constants';
import { isDataTypeNumeric } from 'containers/QueryEditor/data-types';
import { getSelectableValues } from 'containers/QueryEditor/helpers';
import { AggregationType, AggregationFunction } from 'containers/QueryEditor/types';

import { styles } from 'styles';

const ColumnDependableFields: Record<keyof Omit<AggregationType, 'column' | 'id'>, any> = {
  aggregationFunction: null,
  alias: '',
  params: {},
};

const CommonAggregations: AggregationFunction[] = ['count', 'max', 'min', 'some'];

const NumericAggregations: AggregationFunction[] = ['avg', 'sum'];

const AsteriskAggregations: AggregationFunction[] = ['count'];

function getAggregationFunctions(type: string) {
  if (type === AsteriskFieldType) {
    return AsteriskAggregations;
  }
  if (isDataTypeNumeric(type)) {
    return CommonAggregations.concat(NumericAggregations);
  }
  return CommonAggregations;
}

interface AggregationProps {
  aggregation: AggregationType;
  onRemove: VoidFunction;
  onEdit: (value: Partial<AggregationType>) => void;
  fields: readonly string[];
  loading?: boolean;
  type: string;
  validationError?: Partial<Record<keyof AggregationType, string>>;
}

export function Aggregation({
  onRemove,
  onEdit,
  aggregation,
  fields,
  loading,
  type,
  validationError,
}: AggregationProps) {
  const { column, alias, aggregationFunction, params } = aggregation;
  const selectableFields = getSelectableValues(fields);

  const functions = getAggregationFunctions(type).map((func) => ({
    label: AggregationFunctionsMap[func],
    value: func,
  }));
  const handleSelectColumn = (value: SelectableValue<string>) => {
    onEdit({ column: value.value, ...ColumnDependableFields });
  };
  const handleSelectFunction = (value: SelectableValue<AggregationFunction>) => {
    onEdit({ aggregationFunction: value.value });
  };
  const handleChangeAlias = (e: React.FormEvent<HTMLInputElement>) => {
    onEdit({ alias: e.currentTarget.value });
  };
  const handleChangeDistinct = (e: React.FormEvent<HTMLInputElement>) => {
    onEdit({ params: { ...params, distinct: e.currentTarget.checked } });
  };

  return (
    <div className={styles.Common.inlineFieldWithAddition}>
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
      <InlineField error={validationError?.aggregationFunction} invalid={Boolean(validationError?.aggregationFunction)}>
        <Select
          onChange={handleSelectFunction}
          options={functions}
          value={aggregationFunction}
          menuPlacement={'bottom'}
          isSearchable
          placeholder="Choose function"
          width={30}
          allowCustomValue={false}
        />
      </InlineField>
      <InlineField>
        <InlineSwitch label="Distinct" showLabel={true} onChange={handleChangeDistinct} value={params.distinct} />
      </InlineField>
      <InlineField>
        <Input placeholder="alias" width={defaultInputWidth} onChange={handleChangeAlias} value={alias} />
      </InlineField>
      <Button icon="trash-alt" onClick={onRemove} title="Remove aggregation" fill="outline" />
    </div>
  );
}
