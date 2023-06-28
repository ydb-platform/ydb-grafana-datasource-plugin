import * as React from 'react';
import { Select, InlineField, Button } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';

import { GrafanaFormClassName, UnknownFieldType, defaultLabelWidth } from 'containers/QueryEditor/constants';

import { selectors } from 'selectors';
import { TableField } from 'containers/QueryEditor/types';

export type FieldsSelectProps = {
  fields: TableField[];
  selectedFields?: string[];
  loading?: boolean;
  error?: string;
  onFieldsChange: (value: string[]) => void;
};

export function FieldsSelect({ onFieldsChange, selectedFields = [], fields, loading, error }: FieldsSelectProps) {
  const { serverFieldsSet, serverFieldsSelectable } = React.useMemo(() => {
    return {
      serverFieldsSet: new Set(fields.map((f) => f.name)),
      serverFieldsSelectable: fields.map((f) => ({ label: f.name, value: f.name, type: f.type })),
    };
  }, [fields]);

  const allFieldsSelectable = React.useMemo(() => {
    const allFields = [...serverFieldsSelectable];
    selectedFields.forEach((f) => {
      if (serverFieldsSet.has(f)) {
        return;
      } else {
        allFields.push({ label: f, value: f, type: UnknownFieldType });
      }
    });
    return allFields;
  }, [serverFieldsSet, serverFieldsSelectable, selectedFields]);

  const { label, tooltip } = selectors.components.QueryBuilder.Fields;

  const handleChange = (e: Array<SelectableValue<string>>) => {
    onFieldsChange(e.map((el) => el.value ?? '').filter(Boolean));
  };

  return (
    <div className={GrafanaFormClassName}>
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
          options={allFieldsSelectable}
          value={selectedFields}
          menuPlacement={'bottom'}
          allowCustomValue
          isLoading={loading}
          isClearable
          isSearchable
          isMulti
        />
      </InlineField>
      <Button fill="outline" onClick={() => handleChange(serverFieldsSelectable)} disabled={fields.length === 0}>
        All fields
      </Button>
    </div>
  );
}
