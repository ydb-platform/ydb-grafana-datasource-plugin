import { nanoid } from 'nanoid';
import {
  DataSourceInstanceSettings,
  CoreApp,
  DataQueryRequest,
  getTimeZoneInfo,
  getTimeZone,
  DataFrame,
  DataQueryResponse,
  vectorator,
  ScopedVars,
} from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';

import { YdbDataSourceOptions } from 'containers/ConfigEditor/types';
import { ConvertQueryFormatToVisualizationType, normalizeFields, wrapString } from 'containers/QueryEditor/helpers';

import { TableField, YDBQuery } from 'containers/QueryEditor/types';

const defaultQuery: Partial<YDBQuery> = {};

export class DataSource extends DataSourceWithBackend<YDBQuery, YdbDataSourceOptions> {
  database: string;
  // This enables default annotation support for 7.2+
  annotations = {};
  constructor(instanceSettings: DataSourceInstanceSettings<YdbDataSourceOptions>) {
    super(instanceSettings);
    this.database = instanceSettings.jsonData.dbLocation ?? '';
  }

  async fetchTables(): Promise<string[]> {
    const tables = await this.getResource('listTables');
    return tables;
  }

  async fetchFields(table: string): Promise<TableField[]> {
    const fields = await this.getResource('listFields', { table });
    return normalizeFields(fields);
  }

  getDefaultQuery(_: CoreApp): Partial<YDBQuery> {
    return defaultQuery;
  }

  private getTimezone(request: DataQueryRequest<YDBQuery>): string | undefined {
    // timezone specified in the time picker
    if (request.timezone && request.timezone !== 'browser') {
      return request.timezone;
    }
    // fall back to the local timezone
    const localTimezoneInfo = getTimeZoneInfo(getTimeZone(), Date.now());
    return localTimezoneInfo?.ianaName;
  }
  private runQuery(request: Partial<YDBQuery>, options?: any): Promise<DataFrame | { error: string }> {
    return new Promise((resolve) => {
      const req = {
        targets: [{ ...request, refId: nanoid() }],
        range: options ? options.range : undefined,
      } as DataQueryRequest<YDBQuery>;
      this.query(req).subscribe((res: DataQueryResponse) => {
        if (res.state === 'Error') {
          resolve({ error: res.error?.message || 'Something went wrong' });
        } else {
          resolve(res.data[0] || { fields: [] });
        }
      });
    });
  }

  query(request: DataQueryRequest<YDBQuery>) {
    const targets = request.targets
      // filters out queries disabled in UI
      .filter((t) => t.hide !== true)
      // attach timezone information
      .map((t) => {
        return {
          ...t,
          format: ConvertQueryFormatToVisualizationType(t.queryFormat),
          meta: {
            ...t.meta,
            timezone: this.getTimezone(request),
          },
        };
      });

    return super.query({
      ...request,
      targets,
    });
  }
  async metricFindQuery(query: YDBQuery | string, options: any) {
    const ydbQuery: Partial<YDBQuery> = typeof query === 'string' ? { rawSql: query, queryType: 'sql' } : query;

    if (!ydbQuery.rawSql) {
      return [];
    }
    const frame = await this.runQuery(ydbQuery, options);
    if ('error' in frame) {
      throw new Error(frame.error);
    }
    if (frame.fields?.length === 0) {
      return [];
    }
    if (frame?.fields?.length === 1) {
      return vectorator(frame?.fields[0]?.values).map((value) => ({ text: String(value), value: String(value) }));
    }
    // convention - assume the first field is an id field
    const ids = frame?.fields[0]?.values;
    return vectorator(frame?.fields[1]?.values).map((value, i) => ({ text: String(value), value: ids.get(i) }));
  }

  private replace(value = '', scopedVars?: ScopedVars) {
    return getTemplateSrv().replace(value, scopedVars, this.format);
  }

  //this method is used  when no options for variable provided
  private format(value: unknown) {
    const normalizedValue = ([] as unknown[]).concat(value);
    if (normalizedValue.length === 0) {
      return '""';
    }
    return normalizedValue
      .map((el) => {
        if (typeof el === 'string') {
          return wrapString(el, '"');
        }
        return el;
      })
      .join(',');
  }

  applyTemplateVariables(query: YDBQuery, scoped: ScopedVars): YDBQuery {
    let rawQuery = query.rawSql || '';
    return {
      ...query,
      rawSql: this.replace(rawQuery, scoped),
    };
  }
}
