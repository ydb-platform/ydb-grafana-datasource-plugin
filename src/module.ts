import { DataSourcePlugin } from '@grafana/data';

import { ConfigEditor } from './containers/ConfigEditor/ConfigEditor';
import { YDBQueryEditor } from './containers/QueryEditor/YDBQueryEditor';

import { YdbDataSourceOptions } from './containers/ConfigEditor/types';
import { YDBQuery } from 'containers/QueryEditor/types';

import { DataSource } from './datasource';

export const plugin = new DataSourcePlugin<DataSource, YDBQuery, YdbDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(YDBQueryEditor);
