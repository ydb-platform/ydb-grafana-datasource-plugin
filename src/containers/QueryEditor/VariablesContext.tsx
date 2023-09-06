import * as React from 'react';
import { getTemplateSrv } from '@grafana/runtime';

import { panelVariables } from './constants';

const VariablesContext = React.createContext<string[] | undefined>(undefined);

interface VariablesProviderProps {
  children: React.ReactNode;
}

export function VariablesProvider({ children }: VariablesProviderProps) {
  const variables = React.useMemo(() => {
    const rawVariables = getTemplateSrv().getVariables();
    return panelVariables.concat(rawVariables.map((el) => `\${${el.id}}`));
  }, []);

  return <VariablesContext.Provider value={variables}>{children}</VariablesContext.Provider>;
}

export function useVariables() {
  const vars = React.useContext(VariablesContext);

  if (vars === undefined) {
    throw new Error('useVariables should be used within VariablesProvider');
  }

  return vars;
}
