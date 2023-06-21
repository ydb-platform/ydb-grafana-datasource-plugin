import { Select, InlineField } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';

import { defaultLabelWidth } from 'containers/QueryEditor/constants';

import { selectors } from 'selectors';

export type FieldsSelectProps = {
  fields: string[];
  selectedFields?: string[];
  loading?: boolean;
  error?: string;
  onFieldsChange: (value: string[]) => void;
};

export function FieldsSelect({ onFieldsChange, selectedFields = [], fields, loading, error }: FieldsSelectProps) {
  const allFields = Array.from(new Set([...fields, ...selectedFields]));
  const selectableValues = allFields.map((f) => ({ label: f, value: f }));

  const { label, tooltip } = selectors.components.QueryBuilder.Fields;

  const handleChange = (e: Array<SelectableValue<string>>) => {
    onFieldsChange(e.map((el) => el.value ?? '').filter(Boolean));
  };

  return (
    <InlineField
      labelWidth={defaultLabelWidth}
      tooltip={tooltip}
      label={label}
      error={error}
      invalid={Boolean(error)}
      grow
    >
      <Select
        // bug in grafana types. isMulti option is not taken into account
        onChange={handleChange as any}
        options={selectableValues}
        value={selectedFields}
        menuPlacement={'bottom'}
        allowCustomValue
        isLoading={loading}
        isClearable
        isSearchable
        isMulti
      />
    </InlineField>
  );
}
