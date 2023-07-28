import { Select, InlineField } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';

import { defaultInputWidth, defaultLabelWidth } from 'containers/QueryEditor/constants';

import { selectors } from 'selectors';
import { getSelectableValues } from 'containers/QueryEditor/helpers';
import { LogTimeField } from 'containers/QueryEditor/types';
import { isDataTypeDateTime } from 'containers/QueryEditor/data-types';

import { styles } from 'styles';

export type LogTimeFieldSelectProps = {
  fields: string[];
  fieldsMap: Map<string, string>;
  logTimeField?: LogTimeField;
  loading?: boolean;
  error?: string;
  onChange: (value: LogTimeField) => void;
};

export function LogTimeFieldSelect({
  onChange,
  logTimeField = { name: null, cast: null },
  fields,
  loading,
  error,
  fieldsMap,
}: LogTimeFieldSelectProps) {
  const selectableFields = getSelectableValues(fields);

  const { label, tooltip } = selectors.components.QueryBuilder.LogTimeField.Name;

  const handleNameChange = (e: SelectableValue<string>) => {
    onChange({ name: e?.value ?? null, cast: undefined });
  };
  const handleCastChange = (e: SelectableValue<string>) => {
    onChange({ ...logTimeField, cast: e?.value ?? null });
  };

  const logFieldType = logTimeField.name ? fieldsMap.get(logTimeField.name) : undefined;

  const isLogFieldDateTime = logFieldType ? isDataTypeDateTime(logFieldType) : false;

  return (
    <div className={styles.Common.inlineFieldWithAddition}>
      <InlineField
        labelWidth={defaultLabelWidth}
        tooltip={tooltip}
        label={label}
        error={error}
        invalid={Boolean(error)}
      >
        <Select
          onChange={handleNameChange}
          options={selectableFields}
          value={logTimeField?.name ?? null}
          menuPlacement={'bottom'}
          isLoading={loading}
          isSearchable
          width={defaultInputWidth}
        />
      </InlineField>
      {logFieldType && !isLogFieldDateTime && (
        <LogTimeFieldCast value={logTimeField?.cast} onChange={handleCastChange} />
      )}
    </div>
  );
}

const DataTimeTypes = ['Timestamp', 'Date', 'Datetime'];

interface LogTimeFieldCastProps {
  onChange: (e: SelectableValue<string>) => void;
  value?: string | null;
}

function LogTimeFieldCast({ onChange, value }: LogTimeFieldCastProps) {
  const { label, tooltip } = selectors.components.QueryBuilder.LogTimeField.Cast;

  const selectableValues = getSelectableValues(DataTimeTypes);

  return (
    <InlineField labelWidth={defaultLabelWidth} tooltip={tooltip} label={label}>
      <Select
        onChange={onChange}
        options={selectableValues}
        value={value}
        menuPlacement={'bottom'}
        width={defaultInputWidth}
        isClearable
      />
    </InlineField>
  );
}
