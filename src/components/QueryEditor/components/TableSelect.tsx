import { Select, InlineField } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';

import { defaultInputWidth, defaultLabelWidth } from '../constants';

import { selectors } from 'selectors';

function getValuesForSelect(tables: string[], table = '') {
  const values = tables.map((t) => ({ label: t, value: t }));
  // Add selected value to the list if it does not exist.
  if (table && !tables.find((x) => x === table)) {
    values.push({ label: table, value: table });
  }
  return values;
}

export type TableSelectProps = {
  tables: string[];
  table?: string;
  loading?: boolean;
  error?: string;
  onTableChange: (value: string) => void;
};

export function TableSelect({ onTableChange, table, tables, loading, error }: TableSelectProps) {
  const selectableValues = getValuesForSelect(tables, table);

  const { label, tooltip } = selectors.components.QueryBuilder.Table;

  const handleChange = (e: SelectableValue<string>) => {
    onTableChange(e?.value ? e.value : '');
  };

  return (
    <InlineField labelWidth={defaultLabelWidth} tooltip={tooltip} label={label} error={error} invalid={Boolean(error)}>
      <Select
        onChange={handleChange}
        options={selectableValues}
        value={table}
        menuPlacement={'bottom'}
        allowCustomValue={true}
        width={defaultInputWidth}
        isLoading={loading}
        isClearable
        isSearchable
      />
    </InlineField>
  );
}
