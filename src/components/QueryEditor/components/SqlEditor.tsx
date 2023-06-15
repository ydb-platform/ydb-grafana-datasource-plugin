import { InlineField, Input } from '@grafana/ui';

import { OnChangeQueryAttribute, YDBSQLQuery } from '../types';
import { defaultLabelWidth } from '../constants';

interface SqlEditorProps {
  query: YDBSQLQuery;
  onChange: OnChangeQueryAttribute<YDBSQLQuery>;
}

export function SqlEditor({ onChange, query }: SqlEditorProps) {
  const onQueryTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ rawSql: event.target.value });
  };

  const { rawSql } = query;
  return (
    <InlineField label="Query Text" labelWidth={defaultLabelWidth} tooltip="Not used yet">
      <Input onChange={onQueryTextChange} value={rawSql || ''} />
    </InlineField>
  );
}
