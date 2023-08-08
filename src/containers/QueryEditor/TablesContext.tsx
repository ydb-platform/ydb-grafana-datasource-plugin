import { DataSource } from 'datasource';
import * as React from 'react';
import { useDatasource } from './DatasourceContext';

function useFetchTables(datasource: DataSource) {
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

const TablesContext = React.createContext<{ tables: string[]; loading: boolean; error?: string } | undefined>(
  undefined
);

interface TablesProviderProps {
  children: React.ReactNode;
}

export function TablesProvider({ children }: TablesProviderProps) {
  const datasource = useDatasource();
  const [tables, loading, error] = useFetchTables(datasource);
  return <TablesContext.Provider value={{ tables, loading, error }}>{children}</TablesContext.Provider>;
}

export function useTables() {
  const data = React.useContext(TablesContext);

  if (data === undefined) {
    throw new Error('useDatabase should be used within DatabaseProvider');
  }

  return data;
}
