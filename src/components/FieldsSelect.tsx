import { Select, InlineField, Button } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';

import { defaultLabelWidth } from 'containers/QueryEditor/constants';

import { getSelectableValues } from 'containers/QueryEditor/helpers';
import { styles } from 'styles';

export type FieldsSelectProps = {
  fields: string[];
  selectedFields?: string[];
  loading?: boolean;
  error?: string;
  onFieldsChange: (value: string[]) => void;
  selectors: { label: string; tooltip: string };
};

export function FieldsSelect({
  onFieldsChange,
  selectedFields = [],
  fields,
  loading,
  error,
  selectors: { label, tooltip },
}: FieldsSelectProps) {
  const allFields = fields.length > 0 ? Array.from(new Set([...fields, ...selectedFields])) : [];
  const allFieldsSelectable = getSelectableValues(allFields);

  const handleChange = (e: Array<SelectableValue<string>>) => {
    onFieldsChange(e.map((el) => el.value ?? '').filter(Boolean));
  };

  const handleSelectAllFields = () => {
    const serverFieldsSelectable = getSelectableValues(fields);
    handleChange(serverFieldsSelectable);
  };
  return (
    <div className={styles.Common.fieldsSelectWrapper}>
      <InlineField
        labelWidth={defaultLabelWidth}
        tooltip={tooltip}
        label={label}
        error={error}
        invalid={Boolean(error)}
        shrink
      >
        <Select
          // bug in grafana types. isMulti option is not taken into account
          onChange={handleChange as any}
          options={allFieldsSelectable}
          value={selectedFields}
          menuPlacement={'bottom'}
          allowCustomValue
          isLoading={loading}
          isClearable
          isSearchable
          isMulti
          closeMenuOnSelect={false}
        />
      </InlineField>
      <Button fill="outline" onClick={handleSelectAllFields} disabled={fields.length === 0}>
        All fields
      </Button>
    </div>
  );
}
