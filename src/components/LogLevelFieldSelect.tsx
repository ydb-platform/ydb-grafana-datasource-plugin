import { Select, InlineField } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';

import { defaultInputWidth, defaultLabelWidth } from 'containers/QueryEditor/constants';

import { selectors } from 'selectors';
import { TableField } from 'containers/QueryEditor/types';

export type LogLevelFieldSelectProps = {
  fields: TableField[];
  logLevelField?: string | null;
  loading?: boolean;
  error?: string;
  onChange: (value: string | null) => void;
};

export function LogLevelFieldSelect({ onChange, logLevelField, fields, loading, error }: LogLevelFieldSelectProps) {
  const selectableFields = fields.map((f) => ({ label: f.name, value: f.name }));

  const { label, tooltip } = selectors.components.QueryBuilder.LogLevelField;

  const handleChange = (e: SelectableValue<string>) => {
    onChange(e?.value ?? null);
  };

  return (
    <InlineField labelWidth={defaultLabelWidth} tooltip={tooltip} label={label} error={error} invalid={Boolean(error)}>
      <Select
        onChange={handleChange}
        options={selectableFields}
        value={logLevelField}
        menuPlacement={'bottom'}
        isLoading={loading}
        isClearable
        isSearchable
        width={defaultInputWidth}
      />
    </InlineField>
  );
}
