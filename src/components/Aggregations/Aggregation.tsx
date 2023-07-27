import { SelectableValue } from '@grafana/data';
import { Select, Button, Input, InlineSwitch } from '@grafana/ui';

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
}

export function Aggregation({ onRemove, onEdit, aggregation, fields, loading, type }: AggregationProps) {
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
    <div className={styles.Common.grid5}>
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
        onChange={handleSelectFunction}
        options={functions}
        value={aggregationFunction}
        menuPlacement={'bottom'}
        isSearchable
        placeholder="Choose function"
        width={30}
        allowCustomValue={false}
      />
      <InlineSwitch label="Distinct" showLabel={true} onChange={handleChangeDistinct} value={params.distinct} />
      <Input placeholder="alias" width={defaultInputWidth} onChange={handleChangeAlias} value={alias} />
      <Button icon="trash-alt" onClick={onRemove} title="Remove aggregation" fill="outline" />
    </div>
  );
}
