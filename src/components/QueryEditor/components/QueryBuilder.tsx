import * as React from 'react';

import { TableSelect } from './TableSelect';
import { FieldsSelect } from './FieldsSelect';

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
  const [tablesList, tablesLoading, tablesError] = useTables(datasource);
  
  const {
    builderOptions: { table, fields },
  } = query;

  const [fieldsList, fieldsLoading, fieldsError] = useFields(datasource, table);

  const handleChangeBuilderOption = (value: Partial<SqlBuilderOptions>) => {
    onChange({ builderOptions: { ...query.builderOptions, ...value } });
  };

  const handleTableChange = (value: string) => {
    handleChangeBuilderOption({ table: value });
  };

  const handleFieldsChange = (value: string[]) => {
    handleChangeBuilderOption({ fields: value });
  };

  return (
    <React.Fragment>
      <TableSelect
        error={tablesError}
        tables={tablesList}
        table={table}
        loading={tablesLoading}
        onTableChange={handleTableChange}
      />
      <FieldsSelect
        error={fieldsError}
        fields={fieldsList}
        selectedFields={fields}
        onFieldsChange={handleFieldsChange}
        loading={fieldsLoading}
      />
    </React.Fragment>
  );
}
