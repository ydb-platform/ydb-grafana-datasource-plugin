import { Select, InlineField, Button } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';

import { GrafanaFormClassName, defaultLabelWidth } from 'containers/QueryEditor/constants';

import { selectors } from 'selectors';
import { getSelectableValues } from 'containers/QueryEditor/helpers';

export type FieldsSelectProps = {
  fields: string[];
  selectedFields?: string[];
  loading?: boolean;
  error?: string;
  onFieldsChange: (value: string[]) => void;
};

export function FieldsSelect({ onFieldsChange, selectedFields = [], fields, loading, error }: FieldsSelectProps) {
  const allFields = fields.length > 0 ? Array.from(new Set([...fields, ...selectedFields])) : [];
  const allFieldsSelectable = getSelectableValues(allFields);

  const { label, tooltip } = selectors.components.QueryBuilder.Fields;

  const handleChange = (e: Array<SelectableValue<string>>) => {
    onFieldsChange(e.map((el) => el.value ?? '').filter(Boolean));
  };

  const handleSelectAllFields = () => {
    const serverFieldsSelectable = getSelectableValues(fields);
    handleChange(serverFieldsSelectable);
  };
  return (
    <div className={GrafanaFormClassName}>
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
