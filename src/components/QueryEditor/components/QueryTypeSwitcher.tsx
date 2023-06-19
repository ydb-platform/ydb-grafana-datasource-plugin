import * as React from 'react';
import { SelectableValue } from '@grafana/data';
import { RadioButtonGroup, ConfirmModal, InlineField } from '@grafana/ui';

import { QueryType } from '../types';
import { defaultLabelWidth } from '../constants';

import { selectors } from 'selectors';

interface QueryTypeSwitcherProps {
  queryType: QueryType;
  onChange: (type: QueryType) => void;
}

export function QueryTypeSwitcher({ queryType, onChange }: QueryTypeSwitcherProps) {
  const { label, tooltip, options: queryTypeLabels, switcher } = selectors.components.QueryEditor.Types;
  const [confirmModalState, setConfirmModalState] = React.useState<boolean>(false);

  const options: Array<SelectableValue<QueryType>> = [
    { label: queryTypeLabels.SQLEditor, value: 'sql' },
    { label: queryTypeLabels.QueryBuilder, value: 'builder' },
  ];

  const onQueryTypeChange = (queryType: QueryType, confirm = false) => {
    if (queryType === 'builder' && !confirm) {
      setConfirmModalState(true);
    } else {
      onChange(queryType);
    }
  };
  const onConfirmQueryTypeChange = () => {
    onQueryTypeChange('builder', true);
    setConfirmModalState(false);
  };
  return (
    <React.Fragment>
      <InlineField labelWidth={defaultLabelWidth} tooltip={tooltip} label={label}>
        <RadioButtonGroup options={options} value={queryType} onChange={onQueryTypeChange} />
      </InlineField>

      <ConfirmModal
        isOpen={confirmModalState}
        title={switcher.title}
        body={switcher.body}
        confirmText={switcher.confirmText}
        dismissText={switcher.dismissText}
        icon="exclamation-triangle"
        onConfirm={onConfirmQueryTypeChange}
        onDismiss={() => setConfirmModalState(false)}
      />
    </React.Fragment>
  );
}
