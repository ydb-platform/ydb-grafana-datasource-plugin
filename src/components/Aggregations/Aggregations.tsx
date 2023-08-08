import * as React from 'react';

import { InlineField, Button } from '@grafana/ui';

import { AggregationType } from 'containers/QueryEditor/types';
import { selectors } from 'selectors';
import { UnknownFieldType, defaultLabelWidth } from 'containers/QueryEditor/constants';
import { useEntityArrayActions } from 'containers/QueryEditor/helpers';
import { Aggregation } from './Aggregation';

const NEW_AGGREGATION: Omit<AggregationType, 'id'> = { column: '', aggregationFunction: null, params: {} };

interface FiltersProps {
  aggregations?: readonly AggregationType[];
  onChange: (val: AggregationType[]) => void;
  fields: readonly string[];
  fieldsMap: Map<string, string>;
  loading?: boolean;
  error?: string;
  validationErrors?: Array<Partial<Record<keyof AggregationType, string>>>;
}

export function Aggregations({
  aggregations = [],
  onChange,
  fields,
  loading,
  error,
  fieldsMap,
  validationErrors,
}: FiltersProps) {
  const {
    addEntity: addAggregation,
    removeEntity: removeAggregation,
    editEntity: editAggregation,
  } = useEntityArrayActions(aggregations, onChange, NEW_AGGREGATION);
  const { label, tooltip } = selectors.components.QueryBuilder.Aggregations;

  const aggregationFields = ['*'].concat(fields);
  return (
    <InlineField labelWidth={defaultLabelWidth} tooltip={tooltip} label={label} error={error} invalid={Boolean(error)}>
      <React.Fragment>
        {aggregations.map((a, index) => (
          <Aggregation
            key={a.id}
            aggregation={a}
            onRemove={removeAggregation(a.id)}
            type={fieldsMap.get(a.column ?? '') ?? UnknownFieldType}
            fields={aggregationFields}
            loading={loading}
            onEdit={editAggregation(a.id)}
            validationError={validationErrors ? validationErrors[index] : undefined}
          />
        ))}
        <Button icon="plus" onClick={addAggregation}>
          Add aggregation
        </Button>
      </React.Fragment>
    </InlineField>
  );
}
