import { Button, Form } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';

import { QueryFormatSelect } from 'components/QueryFormatSelect';
import { QueryTypeSwitcher } from 'components/QueryTypeSwitcher';
import { QueryBuilder } from './QueryBuilder';
import { SqlEditor } from './SqlEditor';

import { QueryFormat, QueryType, YDBBuilderQuery, YDBQuery, YDBSQLQuery } from './types';
import { YdbDataSourceOptions } from 'containers/ConfigEditor/types';
import { GrafanaFormClassName, defaultYDBBuilderQuery, defaultYDBSQLQuery } from './constants';
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
          <div className={GrafanaFormClassName}>
            <QueryTypeSwitcher queryType={queryType} onChange={handleChangeQueryType} />
            <Button type="submit">Run Query</Button>
          </div>
          <div className={GrafanaFormClassName}>
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
