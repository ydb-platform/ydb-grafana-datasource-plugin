import { Checkbox } from '@grafana/ui';
import { useBuilderSettings, useDispatchBuilderSettings } from 'containers/QueryEditor/EditorSettingsContext';

import { styles } from 'styles';

export function QueryBuilderSettings() {
  const { filtersActive, aggregationsActive } = useBuilderSettings();
  const { setFiltersActive, setAggregationsActive } = useDispatchBuilderSettings();
  return (
    <div className={styles.Common.queryBuilderSettings}>
      <Checkbox label="Filters" value={filtersActive} onChange={(e) => setFiltersActive(e.currentTarget.checked)} />
      <Checkbox
        label="Aggregations"
        value={aggregationsActive}
        onChange={(e) => setAggregationsActive(e.currentTarget.checked)}
      />
    </div>
  );
}
