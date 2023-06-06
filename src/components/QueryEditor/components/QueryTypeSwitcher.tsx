import * as React from 'react';
import { SelectableValue } from '@grafana/data';
import { RadioButtonGroup, ConfirmModal, InlineField } from '@grafana/ui';
import { selectors } from 'selectors';
import { YDBQuery, QueryType } from 'types';

interface QueryTypeSwitcherProps {
  query: YDBQuery;
  onChange: (query: YDBQuery) => void;
}

export const QueryTypeSwitcher = (props: QueryTypeSwitcherProps) => {
  const { query, onChange } = props;
  const { label, tooltip, options: queryTypeLabels, switcher } = selectors.components.QueryEditor.Types;
  const [queryType, setQueryType] = React.useState<QueryType>(
    () => query.queryType || ((query as YDBQuery).rawSql && !(query as YDBQuery).queryType ? 'sql' : 'builder')
  );
  const [confirmModalState, setConfirmModalState] = React.useState<boolean>(false);

  const options: Array<SelectableValue<QueryType>> = [
    { label: queryTypeLabels.SQLEditor, value: 'sql' },
    { label: queryTypeLabels.QueryBuilder, value: 'builder' },
  ];

  const onQueryTypeChange = (queryType: QueryType, confirm = false) => {
    console.log('QUERY', query);
    if (queryType === 'builder' && !confirm) {
      setConfirmModalState(true);
    } else {
      setQueryType(queryType);
      onChange({
        ...query,
        queryType,
      });
    }
  };
  const onConfirmQueryTypeChange = () => {
    onQueryTypeChange('builder', true);
    setConfirmModalState(false);
  };
  return (
    <React.Fragment>
      <InlineField labelWidth={14} tooltip={tooltip} label={label}>
        <RadioButtonGroup options={options} value={queryType} onChange={(e) => onQueryTypeChange(e!)} />
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
};
