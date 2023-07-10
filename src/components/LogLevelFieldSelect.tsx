import { Select, InlineField } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';

import { defaultInputWidth, defaultLabelWidth } from 'containers/QueryEditor/constants';

import { selectors } from 'selectors';
import { getSelectableValues } from 'containers/QueryEditor/helpers';

export type LogLevelFieldSelectProps = {
  fields: string[];
  logLevelField?: string | null;
  loading?: boolean;
  error?: string;
  onChange: (value: string | null) => void;
};

export function LogLevelFieldSelect({ onChange, logLevelField, fields, loading, error }: LogLevelFieldSelectProps) {
  const selectableFields = getSelectableValues(fields);

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
