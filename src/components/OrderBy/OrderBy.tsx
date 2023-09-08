import { SelectableValue } from '@grafana/data';
import { Select, Button } from '@grafana/ui';

import { SortDirectionsMap, defaultInputWidth } from 'containers/QueryEditor/constants';
import { getSelectableValues } from 'containers/QueryEditor/helpers';
import { OrderByType, SortDirectionName } from 'containers/QueryEditor/types';

import { styles } from 'styles';

const options: Array<SelectableValue<SortDirectionName>> = Object.entries(SortDirectionsMap).map(([key, value]) => ({
  label: value,
  value: key as SortDirectionName,
}));

interface OrderByProps {
  orderBy: OrderByType;
  onRemove: VoidFunction;
  onEdit: (value: Partial<OrderByType>) => void;
  fields: readonly string[];
  loading?: boolean;
}

export function OrderBy({ onRemove, onEdit, orderBy: orderBy, fields, loading }: OrderByProps) {
  const { column, sortDirection } = orderBy;

  const selectableFields = getSelectableValues(fields);

  const handleSelectColumn = (value: SelectableValue<string>) => {
    onEdit({ column: value.value });
  };
  const handleSelectSortDirection = (value: SelectableValue<SortDirectionName | null>) => {
    onEdit({ sortDirection: value?.value });
  };

  return (
    <div className={styles.Common.grid5}>
      <Select
        onChange={handleSelectColumn}
        options={selectableFields}
        value={column}
        menuPlacement={'bottom'}
        isLoading={loading}
        isSearchable
        width={defaultInputWidth}
        placeholder="Choose column"
      />
      <Select
        onChange={handleSelectSortDirection}
        options={options}
        value={sortDirection}
        menuPlacement={'bottom'}
        width={30}
        allowCustomValue={false}
      />
      <Button icon="trash-alt" onClick={onRemove} title="Remove field" fill="outline" />
    </div>
  );
}
