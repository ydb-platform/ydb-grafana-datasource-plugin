import * as React from 'react';

import { InlineField, Button } from '@grafana/ui';
import { nanoid } from 'nanoid';

import { Filter } from './Filter';

import { FilterType } from 'containers/QueryEditor/types';
import { selectors } from 'selectors';
import { UnknownFieldType, defaultLabelWidth } from 'containers/QueryEditor/constants';

function removeLogicalOperationFromFirstFilter(filters: FilterType[]) {
  if (!filters.length) {
    return [];
  }
  const normalizedFilters = [...filters];
  const newFirstElement = { ...filters[0], logicalOp: undefined };
  normalizedFilters[0] = newFirstElement;
  return normalizedFilters;
}

function useFiltersActions(filters: readonly FilterType[], onChange: (val: FilterType[]) => void) {
  const handleChange = (newFilters: FilterType[]) => {
    onChange(removeLogicalOperationFromFirstFilter(newFilters));
  };
  const addFilter = () => {
    handleChange([...filters, { id: nanoid(), column: '', expr: null, logicalOp: 'and' }]);
  };
  const removeFilter = (id: string) => () => {
    handleChange(filters.filter((f) => f.id !== id));
  };
  const editFilter = (id: string) => (value: Partial<FilterType>) => {
    const filterIndex = filters.findIndex((el) => el.id === id);
    if (filterIndex === -1) {
      return;
    }
    const newValue = { ...filters[filterIndex], ...value };
    const result = [...filters];
    result[filterIndex] = newValue;
    handleChange(result);
  };

  return { addFilter, removeFilter, editFilter };
}

interface FiltersProps {
  filters?: readonly FilterType[];
  onChange: (val: FilterType[]) => void;
  fields: readonly string[];
  fieldsMap: Map<string, string>;
  loading?: boolean;
  error?: string;
}

export function Filters({ filters = [], onChange, fields, loading, error, fieldsMap }: FiltersProps) {
  const { addFilter, removeFilter, editFilter } = useFiltersActions(filters, onChange);
  const { label, tooltip } = selectors.components.QueryBuilder.Filter;
  return (
    <InlineField labelWidth={defaultLabelWidth} tooltip={tooltip} label={label} error={error} invalid={Boolean(error)}>
      <React.Fragment>
        {filters.map((filter) => (
          <Filter
            key={filter.id}
            filter={filter}
            type={fieldsMap.get(filter.column ?? '') ?? UnknownFieldType}
            onRemove={removeFilter(filter.id)}
            fields={fields}
            loading={loading}
            onEdit={editFilter(filter.id)}
          />
        ))}
        <Button onClick={addFilter}>Add filter</Button>
      </React.Fragment>
    </InlineField>
  );
}
