import { Select, InlineField, InlineSwitch } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';

import { defaultInputWidth, defaultLabelWidth } from 'containers/QueryEditor/constants';

import { selectors } from 'selectors';
import { useDatabase } from 'containers/QueryEditor/DatabaseContext';
import { useStateWithLocalStorage } from 'containers/QueryEditor/helpers';
import { styles } from 'styles';

const SHOW_SYSTEM_TABLES = 'SHOW_SYSTEM_TABLES';

function removeDatabaseFromTableName(table: string, database: string) {
  return table.startsWith(database) ? table.slice(database.length + 1) : table;
}

function getValuesForSelect(tables: string[], table = '', database: string, showSystemTables: string) {
  let values = tables.map((t) => ({ label: removeDatabaseFromTableName(t, database), value: t }));
  // Add selected value to the list if it does not exist.
  if (table && !tables.find((x) => x === table)) {
    values.push({ label: table, value: table });
  }
  if (showSystemTables === 'false') {
    values = values.filter((v) => !v.label.startsWith('.'));
  }
  return values;
}

export type TableSelectProps = {
  tables: string[];
  table?: string;
  loading?: boolean;
  error?: string;
  onTableChange: (value: string) => void;
};

export function TableSelect({ onTableChange, table, tables, loading, error }: TableSelectProps) {
  const [showSystemTables, setShowSystemTables] = useStateWithLocalStorage(SHOW_SYSTEM_TABLES, 'false');
  const database = useDatabase();
  const selectableValues = getValuesForSelect(tables, table, database, showSystemTables);

  const { label, tooltip } = selectors.components.QueryBuilder.Table;

  const handleChange = (e: SelectableValue<string>) => {
    onTableChange(e?.value ? e.value : '');
  };

  return (
    <div className={styles.Common.inlineFieldWithAddition}>
      <InlineField
        labelWidth={defaultLabelWidth}
        tooltip={tooltip}
        label={label}
        error={error}
        invalid={Boolean(error)}
      >
        <Select
          onChange={handleChange}
          options={selectableValues}
          value={table}
          menuPlacement={'bottom'}
          allowCustomValue
          width={defaultInputWidth}
          isLoading={loading}
          isClearable
          isSearchable
        />
      </InlineField>
      <InlineSwitch
        label="Show system tables"
        showLabel={true}
        value={showSystemTables === 'true'}
        onChange={(e) => setShowSystemTables(String(e.currentTarget.checked))}
      />
    </div>
  );
}
