import { Select, InlineField } from '@grafana/ui';
import { QueryFormatNames, defaultInputWidth, defaultLabelWidth } from '../constants';

import { selectors } from 'selectors';
import { QueryFormat } from '../types';
import { SelectableValue } from '@grafana/data';

interface QueryFormatSelectProps {
  format: QueryFormat;
  onChange: (format: QueryFormat) => void;
}

const selectableValues: Array<SelectableValue<QueryFormat>> = Object.entries(QueryFormatNames).map(([key, value]) => ({
  label: value,
  value: key as QueryFormat,
}));

export function QueryFormatSelect({ format, onChange }: QueryFormatSelectProps) {
  const { label, tooltip } = selectors.components.QueryBuilder.Format;

  const handleChange = (value: SelectableValue<QueryFormat>) => {
    onChange(value.value!);
  };

  return (
    <InlineField labelWidth={defaultLabelWidth} tooltip={tooltip} label={label}>
      <Select
        onChange={handleChange}
        options={selectableValues}
        value={format}
        menuPlacement={'bottom'}
        width={defaultInputWidth}
      />
    </InlineField>
  );
}
