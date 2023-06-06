import * as React from 'react';
import { InlineField, Input, Button } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from 'datasource';
import { YDBQuery, YdbDataSourceOptions } from 'types';
import { QueryTypeSwitcher } from './components/QueryTypeSwitcher';

type YDBQueryEditorProps = QueryEditorProps<DataSource, YDBQuery, YdbDataSourceOptions>;

export function YDBQueryEditor({ query, onChange, onRunQuery }: YDBQueryEditorProps) {
  const onQueryTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, rawSql: event.target.value });
  };

  const { rawSql } = query;

  return (
    <React.Fragment>
      <div className="gf-form">
        <div className={'gf-form'}>
          <span>
            <QueryTypeSwitcher query={query} onChange={onChange} />
          </span>
          <Button onClick={() => onRunQuery()}>Run Query</Button>
        </div>
      </div>
      <InlineField label="Query Text" labelWidth={16} tooltip="Not used yet">
        <Input onChange={onQueryTextChange} value={rawSql || ''} />
      </InlineField>
    </React.Fragment>
  );
}
