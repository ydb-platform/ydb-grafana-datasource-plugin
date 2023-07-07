import * as React from 'react';

const DatabaseContext = React.createContext<string | undefined>(undefined);

interface DatabaseProviderProps {
  database: string;
  children: React.ReactNode;
}

export function DatabaseProvider({ children, database }: DatabaseProviderProps) {
  return <DatabaseContext.Provider value={database}>{children}</DatabaseContext.Provider>;
}

export function useDatabase() {
  const db = React.useContext(DatabaseContext);

  if (db === undefined) {
    throw new Error('useDatabase should be used within DatabaseProvider');
  }

  return db;
}
