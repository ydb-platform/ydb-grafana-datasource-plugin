import { DataSourcePlugin } from '@grafana/data';

import { ConfigEditor } from './components/ConfigEditor/ConfigEditor';
import { YDBQueryEditor } from './components/QueryEditor/YDBQueryEditor';

import { YdbDataSourceOptions } from './components/ConfigEditor/types';
import { YDBQuery } from 'components/QueryEditor/types';

import { DataSource } from './datasource';

export const plugin = new DataSourcePlugin<DataSource, YDBQuery, YdbDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(YDBQueryEditor);
