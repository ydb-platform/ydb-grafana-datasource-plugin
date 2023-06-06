import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './datasource';
import { ConfigEditor } from './components/ConfigEditor/ConfigEditor';
import { YDBQueryEditor } from './components/QueryEditor/QueryEditor';
import { YDBQuery, YdbDataSourceOptions } from './types';

export const plugin = new DataSourcePlugin<DataSource, YDBQuery, YdbDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(YDBQueryEditor);
