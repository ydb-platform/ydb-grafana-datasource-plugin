import { DataSourceInstanceSettings, CoreApp, DataQueryRequest, getTimeZoneInfo, getTimeZone } from '@grafana/data';
import { DataSourceWithBackend } from '@grafana/runtime';

import { YdbDataSourceOptions } from 'components/ConfigEditor/types';
import { ConvertQueryFormatToVisualizationType } from 'components/QueryEditor/helpers';

import { YDBQuery } from 'components/QueryEditor/types';

const defaultQuery: Partial<YDBQuery> = {};

export class DataSource extends DataSourceWithBackend<YDBQuery, YdbDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<YdbDataSourceOptions>) {
    super(instanceSettings);
  }

  async fetchTables(): Promise<string[]> {
    const tables = await this.getResource('listTables');
    return tables;
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
}
