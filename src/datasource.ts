import { DataSourceInstanceSettings, CoreApp } from '@grafana/data';
import { DataSourceWithBackend } from '@grafana/runtime';

import { YdbQuery, YdbDataSourceOptions, DEFAULT_QUERY } from './types';

export class DataSource extends DataSourceWithBackend<YdbQuery, YdbDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<YdbDataSourceOptions>) {
    super(instanceSettings);
  }

  getDefaultQuery(_: CoreApp): Partial<YdbQuery> {
    return DEFAULT_QUERY;
  }
}
