import * as React from 'react';
import { defaultSqlEditorHeight } from './constants';
import { useStateWithLocalStorage } from './helpers';
import { SqlBuilderOptions } from './types';

const EditorHeightContext = React.createContext<number | undefined>(undefined);
const EditorHeightDispatchContext = React.createContext<React.Dispatch<React.SetStateAction<number>> | undefined>(
  undefined
);
const FiltersActiveContext = React.createContext<boolean | undefined>(undefined);
const FiltersActiveDispatchContext = React.createContext<React.Dispatch<React.SetStateAction<boolean>> | undefined>(
  undefined
);
const AggregationsActiveContext = React.createContext<boolean | undefined>(undefined);
const AggregationsActiveDispatchContext = React.createContext<
  React.Dispatch<React.SetStateAction<boolean>> | undefined
>(undefined);

interface EditorHeightProviderProps {
  children: React.ReactNode;
}

const SQL_EDITOR_HEIGHT_LS_KEY = 'SQL_EDITOR_HEIGHT_LS_KEY';

export function EditorHeightProvider({ children }: EditorHeightProviderProps) {
  const [editorHeight, setEditorHeight] = useStateWithLocalStorage<number>(
    SQL_EDITOR_HEIGHT_LS_KEY,
    defaultSqlEditorHeight
  );
  return (
    <EditorHeightDispatchContext.Provider value={setEditorHeight}>
      <EditorHeightContext.Provider value={editorHeight}>{children}</EditorHeightContext.Provider>
    </EditorHeightDispatchContext.Provider>
  );
}

export function useEditorHeight() {
  const height = React.useContext(EditorHeightContext);

  if (height === undefined) {
    throw new Error('useEditorHeight should be used within EditorHeightProvider');
  }

  return height;
}
export function useDispatchEditorHeight() {
  const setHeight = React.useContext(EditorHeightDispatchContext);

  if (setHeight === undefined) {
    throw new Error('useDispatchEditorHeight should be used within EditorHeightProvider');
  }

  return setHeight;
}

interface BuilderSettingsProviderProps {
  children: React.ReactNode;
  builderOptions: SqlBuilderOptions;
}

export function BuilderSettingsProvider({ children, builderOptions }: BuilderSettingsProviderProps) {
  const [filtersActive, setFiltersActive] = React.useState(() => Boolean(builderOptions.filters));
  const [aggregationsActive, setAggregationsActive] = React.useState(() =>
    Boolean(builderOptions.groupBy || builderOptions.aggregations)
  );
  return (
    <FiltersActiveDispatchContext.Provider value={setFiltersActive}>
      <AggregationsActiveDispatchContext.Provider value={setAggregationsActive}>
        <AggregationsActiveContext.Provider value={aggregationsActive}>
          <FiltersActiveContext.Provider value={filtersActive}>{children}</FiltersActiveContext.Provider>
        </AggregationsActiveContext.Provider>
      </AggregationsActiveDispatchContext.Provider>
    </FiltersActiveDispatchContext.Provider>
  );
}

export function useBuilderSettings() {
  const filtersActive = React.useContext(FiltersActiveContext);
  const aggregationsActive = React.useContext(AggregationsActiveContext);

  if (filtersActive === undefined || aggregationsActive === undefined) {
    throw new Error('useBuilderSettings should be used within BuilderSettingsProvider');
  }

  return { filtersActive, aggregationsActive };
}

export function useDispatchBuilderSettings() {
  const setFiltersActive = React.useContext(FiltersActiveDispatchContext);
  const setAggregationsActive = React.useContext(AggregationsActiveDispatchContext);

  if (setFiltersActive === undefined || setAggregationsActive === undefined) {
    throw new Error('useDispatchBuilderSettings should be used within BuilderSettingsProvider');
  }

  return { setFiltersActive, setAggregationsActive };
}
