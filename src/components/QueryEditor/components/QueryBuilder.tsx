import * as React from 'react';

import { TableSelect } from './TableSelect';

import { SqlBuilderOptions, YDBBuilderQuery, OnChangeQueryAttribute } from '../types';
import { DataSource } from 'datasource';
interface QueryBuilderProps {
  datasource: DataSource;
  query: YDBBuilderQuery;
  onChange: OnChangeQueryAttribute<YDBBuilderQuery>;
}

function useTables(datasource: DataSource) {
  const [tablesList, setTablesList] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>();
  React.useEffect(() => {
    setLoading(true);
    setError(undefined);
    datasource
      .fetchTables()
      .then((tables) => {
        setTablesList(tables);
      })
      .catch((err) => {
        setError(`Fetching tables failed: ${String(err)}`);
      })
      .finally(() => setLoading(false));
  }, [datasource]);

  return [tablesList, loading, error] as const;
}

export function QueryBuilder({ query, datasource, onChange }: QueryBuilderProps) {
  const [tablesList, loading, error] = useTables(datasource);
  const {
    builderOptions: { table },
  } = query;

  const handleChangeBuilderOption = (value: Partial<SqlBuilderOptions>) => {
    onChange({ builderOptions: { ...query.builderOptions, ...value } });
  };

  const handleTableChange = (value: string) => {
    handleChangeBuilderOption({ table: value });
  };

  return (
    <TableSelect error={error} tables={tablesList} table={table} loading={loading} onTableChange={handleTableChange} />
  );
}
