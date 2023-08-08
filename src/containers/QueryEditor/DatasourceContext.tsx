import { DataSource } from 'datasource';
import * as React from 'react';

const DatasourceContext = React.createContext<DataSource | undefined>(undefined);

interface DatasourceProviderProps {
  datasource: DataSource;
  children: React.ReactNode;
}

export function DatasourceProvider({ children, datasource }: DatasourceProviderProps) {
  return <DatasourceContext.Provider value={datasource}>{children}</DatasourceContext.Provider>;
}

export function useDatasource() {
  const ds = React.useContext(DatasourceContext);

  if (ds === undefined) {
    throw new Error('useDatasource should be used within DatasourceProvider');
  }

  return ds;
}

export function useDatabase() {
  const datasource = React.useContext(DatasourceContext);
  if (datasource === undefined) {
    throw new Error('useDatabase should be used within DatasourceProvider');
  }
  const db = datasource?.database;

  return db;
}
