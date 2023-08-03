import * as React from 'react';
import { DataSource } from 'datasource';

import { TableSelect } from 'components/TableSelect';
import { FieldsSelect } from 'components/FieldsSelect';
import { Limit } from 'components/Limit';
import { SqlPreview } from 'components/SqlPreview';
import { LogLevelFieldSelect } from 'components/LogLevelFieldSelect';
import { Filters } from 'components/Filters/Filters';
import { Aggregations } from 'components/Aggregations/Aggregations';
import { LogTimeFieldSelect } from 'components/LogTimeFieldSelect';

import { useBuilderSettings } from './EditorSettingsContext';

import {
  SqlBuilderOptions,
  YDBBuilderQuery,
  OnChangeQueryAttribute,
  TableField,
  FilterType,
  AggregationType,
  LogTimeField,
  QueryErrors,
} from './types';
import { getRawSqlFromBuilderOptions } from './prepare-query';
import { AsteriskFieldType, UnknownFieldType } from './constants';
import { selectors } from 'selectors';
import { isDataTypeDateTime } from './data-types';

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
  const [fieldsList, setFieldsList] = React.useState<TableField[]>([]);
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
    } else {
      setFieldsList([]);
    }
  }, [datasource, table]);

  return [fieldsList, loading, error] as const;
}

const TableDependableFields: Record<keyof Omit<SqlBuilderOptions, 'limit' | 'rawSqlBuilder' | 'table'>, any> = {
  fields: [],
  logLevelField: null,
  filters: undefined,
  loglineFields: undefined,
  groupBy: undefined,
  aggregations: undefined,
  logTimeField: undefined,
};

interface QueryBuilderProps {
  datasource: DataSource;
  query: YDBBuilderQuery;
  onChange: OnChangeQueryAttribute<YDBBuilderQuery>;
  queryErrors?: QueryErrors;
}

export function QueryBuilder({ query, datasource, onChange, queryErrors }: QueryBuilderProps) {
  const [tables, tablesLoading, tablesError] = useTables(datasource);
  const { filtersActive, aggregationsActive } = useBuilderSettings();

  const {
    rawSql,
    queryFormat,
    builderOptions: {
      table,
      fields: selectedFields,
      limit,
      logLevelField,
      filters,
      loglineFields,
      groupBy,
      aggregations,
      logTimeField,
    },
  } = query;

  const [fields, fieldsLoading, fieldsError] = useFields(datasource, table);

  const { fieldsMap, allFieldsNames } = React.useMemo(() => {
    const fieldsMap = new Map<string, string>();
    fields.forEach((f) => fieldsMap.set(f.name, f.type ?? UnknownFieldType));
    fieldsMap.set('*', AsteriskFieldType);
    return {
      allFieldsNames: fields.map((el) => el.name),
      fieldsMap,
    };
  }, [fields]);

  const handleChangeBuilderOption = (value: Partial<SqlBuilderOptions>) => {
    const newBuilderOptions = { ...query.builderOptions, ...value };
    const rawSql = getRawSqlFromBuilderOptions(newBuilderOptions, queryFormat);
    onChange({ rawSql, builderOptions: { ...query.builderOptions, ...value, rawSqlBuilder: rawSql } });
  };
  const handleTableChange = (value: string) => {
    handleChangeBuilderOption({ table: value, ...TableDependableFields });
  };
  const handleFieldsChange = (value: string[]) => {
    handleChangeBuilderOption({ fields: value });
  };
  const handleLoglineFieldsChange = (value: string[]) => {
    handleChangeBuilderOption({ loglineFields: value });
  };
  const handleGroupByChange = (value: string[]) => {
    handleChangeBuilderOption({ groupBy: value });
  };
  const handleLimitChange = (value: number) => {
    handleChangeBuilderOption({ limit: value });
  };
  const handleLogLevelFieldChange = (value: string | null) => {
    handleChangeBuilderOption({ logLevelField: value });
  };
  const handleLogTimeFieldChange = (value: LogTimeField) => {
    handleChangeBuilderOption({ logTimeField: value });
  };
  const handleFiltersChange = (value: FilterType[]) => {
    handleChangeBuilderOption({ filters: value });
  };
  const handleAggregationsChange = (value: AggregationType[]) => {
    handleChangeBuilderOption({ aggregations: value });
  };

  if (queryFormat === 'logs' && !logTimeField?.name) {
    const firstDateTimeField = fields.find((f) => f.type && isDataTypeDateTime(f.type));
    const name = firstDateTimeField?.name;
    if (name) {
      handleLogTimeFieldChange({ name });
    }
  }

  const commonFieldsProps = {
    error: fieldsError,
    loading: fieldsLoading,
    fields: allFieldsNames,
  };
  return (
    <React.Fragment>
      <TableSelect
        error={tablesError}
        validationError={queryErrors?.table}
        tables={tables}
        table={table}
        loading={tablesLoading}
        onTableChange={handleTableChange}
      />
      <FieldsSelect
        {...commonFieldsProps}
        validationError={queryErrors?.fields}
        selectedFields={selectedFields}
        onFieldsChange={handleFieldsChange}
        selectors={selectors.components.QueryBuilder.Fields}
      />
      {aggregationsActive && (
        <Aggregations
          {...commonFieldsProps}
          aggregations={aggregations}
          fieldsMap={fieldsMap}
          onChange={handleAggregationsChange}
          validationErrors={queryErrors?.aggregations}
        />
      )}
      {queryFormat === 'logs' && (
        <React.Fragment>
          <LogTimeFieldSelect
            {...commonFieldsProps}
            validationError={queryErrors?.logTimeField}
            onChange={handleLogTimeFieldChange}
            logTimeField={logTimeField}
            fieldsMap={fieldsMap}
          />
          <LogLevelFieldSelect
            {...commonFieldsProps}
            onChange={handleLogLevelFieldChange}
            logLevelField={logLevelField}
          />
          <FieldsSelect
            {...commonFieldsProps}
            selectedFields={loglineFields}
            onFieldsChange={handleLoglineFieldsChange}
            selectors={selectors.components.QueryBuilder.LogLineFields}
          />
        </React.Fragment>
      )}
      {filtersActive && (
        <Filters
          {...commonFieldsProps}
          filters={filters}
          onChange={handleFiltersChange}
          fieldsMap={fieldsMap}
          validationErrors={queryErrors?.filters}
        />
      )}
      {aggregationsActive && (
        <FieldsSelect
          {...commonFieldsProps}
          selectedFields={groupBy}
          onFieldsChange={handleGroupByChange}
          selectors={selectors.components.QueryBuilder.GroupBy}
        />
      )}
      <Limit limit={limit} onChange={handleLimitChange} />
      <SqlPreview rawSql={rawSql} />
    </React.Fragment>
  );
}
