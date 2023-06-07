import { DataSourceInstanceSettings, CoreApp } from '@grafana/data';
import { DataSourceWithBackend } from '@grafana/runtime';

import { YDBQuery, YdbDataSourceOptions } from './types';

const defaultQuery: Partial<YDBQuery> = {};

export class DataSource extends DataSourceWithBackend<YDBQuery, YdbDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<YdbDataSourceOptions>) {
    super(instanceSettings);
  }

  getDefaultQuery(_: CoreApp): Partial<YDBQuery> {
    return defaultQuery;
  }
}
