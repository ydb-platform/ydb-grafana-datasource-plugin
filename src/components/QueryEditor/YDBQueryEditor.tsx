import { Button, Form } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';

import { QueryTypeSwitcher } from './components/QueryTypeSwitcher';
import { QueryBuilder } from './components/QueryBuilder';
import { SqlEditor } from './components/SqlEditor';
import { QueryFormatSelect } from './components/QueryFormatSelect';

import { QueryFormat, QueryType, YDBBuilderQuery, YDBQuery, YDBSQLQuery } from './types';
import { YdbDataSourceOptions } from 'components/ConfigEditor/types';
import { defaultYDBBuilderQuery, defaultYDBSQLQuery } from './constants';
import { DataSource } from 'datasource';

type YDBQueryEditorProps = QueryEditorProps<DataSource, YDBQuery, YdbDataSourceOptions>;

function normalizeBuilderQuery(query: YDBBuilderQuery): YDBBuilderQuery {
  return { ...defaultYDBBuilderQuery, ...query };
}
function normalizeSQLQuery(query: YDBSQLQuery): YDBSQLQuery {
  return { ...defaultYDBSQLQuery, ...query };
}

function normalizeQuery(query: YDBQuery) {
  if (query.queryType === 'sql') {
    return normalizeSQLQuery(query);
  }
  return normalizeBuilderQuery(query);
}

export function YDBQueryEditor({ query: baseQuery, onChange, onRunQuery, datasource }: YDBQueryEditorProps) {
  const query = normalizeQuery(baseQuery);
  const { queryType, queryFormat } = query;

  const handleChangeQueryAttribute = <T,>(value: Partial<T>) => {
    onChange({ ...query, ...value });
  };

  const handleChangeQueryType = (type: QueryType) => {
    handleChangeQueryAttribute<YDBQuery>({ queryType: type });
  };

  const handleChangeQueryFormat = (format: QueryFormat) => {
    handleChangeQueryAttribute<YDBQuery>({ queryFormat: format });
  };

  return (
    <Form onSubmit={onRunQuery} maxWidth="none">
      {() => (
        <>
          <div className={'gf-form'}>
            <QueryTypeSwitcher queryType={queryType} onChange={handleChangeQueryType} />
            <Button type="submit">Run Query</Button>
          </div>
          <div className={'gf-form'}>
            <QueryFormatSelect format={queryFormat} onChange={handleChangeQueryFormat} />
          </div>
          {queryType === 'builder' ? (
            <QueryBuilder
              datasource={datasource}
              query={query}
              onChange={handleChangeQueryAttribute<YDBBuilderQuery>}
            />
          ) : (
            <SqlEditor onChange={handleChangeQueryAttribute<YDBSQLQuery>} query={query} />
          )}
        </>
      )}
    </Form>
  );
}
