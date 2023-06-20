import * as React from 'react';

import { TableSelect } from './TableSelect';
import { FieldsSelect } from './FieldsSelect';

import { SqlBuilderOptions, YDBBuilderQuery, OnChangeQueryAttribute } from '../types';
import { DataSource } from 'datasource';
import { Limit } from './Limit';

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
      .catch(() => {
        setError('Fetching tables failed');
      })
      .finally(() => setLoading(false));
  }, [datasource]);

  return [tablesList, loading, error] as const;
}

function useFields(datasource: DataSource, table?: string) {
  const [fieldsList, setFieldsList] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>();
  React.useEffect(() => {
    if (table) {
      setLoading(true);
      setError(undefined);
      datasource
        .fetchFields(table)
        .then((fields) => {
          setFieldsList(fields);
        })
        .catch(() => {
          setError('Fetching table fields failed');
        })
        .finally(() => setLoading(false));
    }
  }, [datasource, table]);

  return [fieldsList, loading, error] as const;
}

export function QueryBuilder({ query, datasource, onChange }: QueryBuilderProps) {
  const [tables, tablesLoading, tablesError] = useTables(datasource);

  const {
    builderOptions: { table, fields: selectedFields, limit },
  } = query;

  const [fields, fieldsLoading, fieldsError] = useFields(datasource, table);

  const handleChangeBuilderOption = (value: Partial<SqlBuilderOptions>) => {
    onChange({ builderOptions: { ...query.builderOptions, ...value } });
  };

  const handleTableChange = (value: string) => {
    handleChangeBuilderOption({ table: value });
  };

  const handleFieldsChange = (value: string[]) => {
    handleChangeBuilderOption({ fields: value });
  };

  const handleLimitChange = (value: number) => {
    handleChangeBuilderOption({ limit: value });
  };

  return (
    <React.Fragment>
      <TableSelect
        error={tablesError}
        tables={tables}
        table={table}
        loading={tablesLoading}
        onTableChange={handleTableChange}
      />
      <FieldsSelect
        error={fieldsError}
        fields={fields}
        selectedFields={selectedFields}
        onFieldsChange={handleFieldsChange}
        loading={fieldsLoading}
      />
      <Limit limit={limit} onChange={handleLimitChange} />
    </React.Fragment>
  );
}
