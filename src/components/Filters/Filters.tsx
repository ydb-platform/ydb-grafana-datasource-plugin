import * as React from 'react';

import { InlineField, Button } from '@grafana/ui';

import { Filter } from './Filter';

import { FilterType } from 'containers/QueryEditor/types';
import { selectors } from 'selectors';
import { UnknownFieldType, defaultLabelWidth } from 'containers/QueryEditor/constants';
import { useEntityArrayActions } from 'containers/QueryEditor/helpers';
import { useVariables } from 'containers/QueryEditor/VariablesContext';

function removeLogicalOperationFromFirstFilter(filters: FilterType[]) {
  if (!filters.length) {
    return [];
  }
  const normalizedFilters = [...filters];
  const newFirstElement = { ...filters[0], logicalOp: undefined };
  normalizedFilters[0] = newFirstElement;
  return normalizedFilters;
}

const NEW_FILTER: Omit<FilterType, 'id'> = {
  column: '',
  expr: null,
  logicalOp: 'and',
  paramsType: null,
};

interface FiltersProps {
  filters?: readonly FilterType[];
  onChange: (val: FilterType[]) => void;
  fields: readonly string[];
  fieldsMap: Map<string, string>;
  loading?: boolean;
  error?: string;
}

export function Filters({ filters = [], onChange, fields, loading, error, fieldsMap }: FiltersProps) {
  const handleChange = (newFilters: FilterType[]) => {
    onChange(removeLogicalOperationFromFirstFilter(newFilters));
  };

  const {
    addEntity: addFilter,
    removeEntity: removeFilter,
    editEntity: editFilter,
  } = useEntityArrayActions(filters, handleChange, NEW_FILTER);
  const { label, tooltip } = selectors.components.QueryBuilder.Filter;
  const variables = useVariables();

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
            variables={variables}
          />
        ))}
        <Button icon="plus" onClick={addFilter}>
          Add filter
        </Button>
      </React.Fragment>
    </InlineField>
  );
}
