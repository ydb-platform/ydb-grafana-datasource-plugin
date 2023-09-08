import * as React from 'react';

import { InlineField, Button } from '@grafana/ui';

import { OrderBy } from './OrderBy';

import { OrderByType } from 'containers/QueryEditor/types';
import { selectors } from 'selectors';
import { defaultLabelWidth } from 'containers/QueryEditor/constants';
import { useEntityArrayActions } from 'containers/QueryEditor/helpers';

const NEW_ORDER_BY: Omit<OrderByType, 'id'> = {
  column: '',
  sortDirection: 'ASC',
};

interface OrderBysProps {
  orderBy?: readonly OrderByType[];
  onChange: (val: OrderByType[]) => void;
  fields: readonly string[];
  loading?: boolean;
  error?: string;
}

export function OrderBys({ orderBy = [], onChange, fields, loading, error }: OrderBysProps) {
  const {
    addEntity: addOrderBy,
    removeEntity: removeOrderBy,
    editEntity: editOrderBy,
  } = useEntityArrayActions(orderBy, onChange, NEW_ORDER_BY);

  const { label, tooltip } = selectors.components.QueryBuilder.OrderBy;

  return (
    <InlineField labelWidth={defaultLabelWidth} tooltip={tooltip} label={label} error={error} invalid={Boolean(error)}>
      <React.Fragment>
        {orderBy.map((orderBy) => (
          <OrderBy
            key={orderBy.id}
            orderBy={orderBy}
            onRemove={removeOrderBy(orderBy.id)}
            fields={fields}
            loading={loading}
            onEdit={editOrderBy(orderBy.id)}
          />
        ))}
        <Button icon="plus" onClick={addOrderBy}>
          Add order by
        </Button>
      </React.Fragment>
    </InlineField>
  );
}
