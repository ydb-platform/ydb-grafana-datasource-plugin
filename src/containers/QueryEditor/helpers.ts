import * as React from 'react';
import { nanoid } from 'nanoid';

import { AggregationType, FilterType, QueryFormat, TableField, TableFieldBackend, YDBQuery } from './types';
import { expressionsWithNoParams } from './constants';

export function ConvertQueryFormatToVisualizationType(format: QueryFormat) {
  switch (format) {
    case 'table':
      return 1;
    case 'timeseries':
      return 0;
    case 'logs':
      return 2;
    default:
      return 1;
  }
}

export const defaultWrapper = '`';

const escapeBackticksRe = /[\\`]/g;
const escapeDoubleQuotesRe = /[\\"]/g;

function escapeString(re: RegExp, st: string) {
  return st && st.replaceAll(re, '\\$&');
}

export function wrapString(val: string, wrapper = defaultWrapper) {
  return `${wrapper}${val}${wrapper}`;
}

export function escapeAndWrapString(st = '', wrapper = defaultWrapper) {
  let escapedString = '';
  if (wrapper === '`') {
    escapedString = escapeString(escapeBackticksRe, st);
  } else if (wrapper === '"') {
    escapedString = escapeString(escapeDoubleQuotesRe, st);
  }
  return escapedString && wrapString(escapedString, wrapper);
}

export function normalizeFields(fields: TableFieldBackend[]): TableField[] {
  return fields.map((f) => ({ name: f.Name, type: f.Type }));
}

export function getSelectableValues(fields: readonly string[]) {
  return fields.map((f) => ({ label: f, value: f }));
}

function useLocalStorage<T>(key: string, initialValue: T) {
  const setValue = React.useCallback(
    (value: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
    },
    [key]
  );
  const getValue = React.useCallback(() => {
    try {
      const storedValue = localStorage.getItem(key);

      if (storedValue === null) {
        return initialValue;
      }
      return JSON.parse(storedValue);
    } catch {
      try {
        localStorage.removeItem(key);
      } catch {}
      return initialValue;
    }
  }, [key, initialValue]);

  return { getValue, setValue };
}

export function useStateWithLocalStorage<T>(key: string, initialValue: T) {
  const { getValue, setValue } = useLocalStorage(key, initialValue);
  const [state, setState] = React.useState<T>(() => getValue());

  const mounted = React.useRef(false);
  React.useEffect(() => {
    if (mounted.current) {
      setValue(state);
    }
    mounted.current = true;
  }, [state, setValue]);

  return [state, setState] as const;
}

export function useEntityArrayActions<T extends { id: string }>(
  entities: readonly T[],
  onChange: (val: T[]) => void,
  newEntity: Omit<T, 'id'>
) {
  const addEntity = () => {
    onChange([...entities, { ...newEntity, id: nanoid() } as T]);
  };
  const removeEntity = (id: string) => () => {
    onChange(entities.filter((f) => f.id !== id));
  };
  const editEntity = (id: string) => (value: Partial<T>) => {
    const filterIndex = entities.findIndex((el) => el.id === id);
    if (filterIndex === -1) {
      return;
    }
    const newValue = { ...entities[filterIndex], ...value };
    const result = [...entities];
    result[filterIndex] = newValue;
    onChange(result);
  };

  return { addEntity, removeEntity, editEntity };
}

export function validateQuery(query: YDBQuery) {
  if (query.queryType === 'builder') {
    const queryOptions = query.builderOptions ?? {};
    const hasFields =
      queryOptions.fields?.filter(Boolean).length || (query.queryFormat === 'logs' && queryOptions.logTimeField);
    return {
      table: queryOptions.table ? undefined : 'Required',
      fields: hasFields ? undefined : 'Required',
      aggregations: queryOptions.aggregations?.map((a) => {
        const error: Partial<Record<keyof AggregationType, string>> = {};
        if (!a.column) {
          error.column = 'Required';
        }
        if (!a.aggregationFunction) {
          error.aggregationFunction = 'Required';
        }
        return error;
      }),
      filters: queryOptions.filters?.map((f) => {
        const error: Partial<Record<keyof FilterType, string>> = {};
        if (!f.column) {
          error.column = 'Required';
        }
        if (!f.expr) {
          error.expr = 'Required';
        }
        if (f.expr && !expressionsWithNoParams.includes(f.expr)) {
          error.params = !f.params && f.params !== 0 ? 'Required' : undefined;
        }
        return error;
      }),
      logTimeField: {
        name: queryOptions.logTimeField?.name ? undefined : 'Required',
        cast:
          queryOptions.logTimeField?.dateTimeType === false && !queryOptions.logTimeField?.cast
            ? 'Required'
            : undefined,
      },
    };
  }
  return undefined;
}

export function hasValidationErrors(errors?: Partial<Record<string, unknown>>): boolean {
  if (!errors) {
    return false;
  }

  return (
    Object.values(errors)
      .map((value) => {
        if (typeof value === 'string') {
          return value.length > 0;
        }
        if (Array.isArray(value)) {
          const valueHasErrors = value.map((el) => hasValidationErrors(el));
          return valueHasErrors.filter(Boolean).length > 0;
        }
        if (value && typeof value === 'object') {
          return hasValidationErrors(value);
        }
        return false;
      })
      .filter(Boolean).length > 0
  );
}
