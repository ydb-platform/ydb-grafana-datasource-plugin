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
  validationError?: Partial<Record<keyof LogTimeField, string>>;
};

export function LogTimeFieldSelect({
  onChange,
  logTimeField = { name: null, cast: null, dateTimeType: undefined },
  fields,
  loading,
  error,
  fieldsMap,
  validationError,
}: LogTimeFieldSelectProps) {
  const selectableFields = getSelectableValues(fields);

  const { label, tooltip } = selectors.components.QueryBuilder.LogTimeField.Name;

  const handleNameChange = (e: SelectableValue<string>) => {
    const newName = e?.value ?? null;
    const logFieldType = newName ? fieldsMap.get(newName) : undefined;
    const isLogFieldDateTime = logFieldType ? isDataTypeDateTime(logFieldType) : undefined;
    onChange({ name: newName, cast: null, dateTimeType: isLogFieldDateTime });
  };
  const handleCastChange = (e: SelectableValue<string>) => {
    onChange({ ...logTimeField, cast: e?.value ?? null });
  };

  return (
    <div className={styles.Common.inlineFieldWithAddition}>
      <InlineField
        labelWidth={defaultLabelWidth}
        tooltip={tooltip}
        label={label}
        error={error || validationError?.name}
        invalid={Boolean(error || validationError?.name)}
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
      {logTimeField?.dateTimeType === false && (
        <LogTimeFieldCast
          value={logTimeField?.cast}
          onChange={handleCastChange}
          validationError={validationError?.cast}
        />
      )}
    </div>
  );
}

const DataTimeTypes = ['Timestamp', 'Date', 'Datetime'];

interface LogTimeFieldCastProps {
  onChange: (e: SelectableValue<string>) => void;
  value?: string | null;
  validationError?: string;
}

function LogTimeFieldCast({ onChange, value, validationError }: LogTimeFieldCastProps) {
  const { label, tooltip } = selectors.components.QueryBuilder.LogTimeField.Cast;

  const selectableValues = getSelectableValues(DataTimeTypes);

  return (
    <InlineField
      labelWidth={defaultLabelWidth}
      tooltip={tooltip}
      label={label}
      error={validationError}
      invalid={Boolean(validationError)}
    >
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
