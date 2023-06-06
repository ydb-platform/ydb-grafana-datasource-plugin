import { DataQuery, DataSourceJsonData, DataSourcePluginOptionsEditorProps } from '@grafana/data';

export const QueryTypes = {
  SQL: 'sql',
  Builder: 'builder',
} as const;

export type QueryType = (typeof QueryTypes)[keyof typeof QueryTypes];

export interface YDBQueryBase extends DataQuery {}

export interface YDBSQLQuery extends YDBQueryBase {
  queryType: typeof QueryTypes.SQL;
  rawSql: string;
  //   meta?: {
  //     timezone?: string;
  //     // meta fields to be used just for building builder options when migrating  back to QueryType.Builder
  //     builderOptions?: SqlBuilderOptions;
  //   };
}

export interface YDBBuilderQuery extends YDBQueryBase {
  queryType: typeof QueryTypes.Builder;
  rawSql: string;
  //   builderOptions: SqlBuilderOptions;
  //   format: Format;
  //   selectedFormat: Format;
  //   meta?: {
  //     timezone?: string;
  //   };
}

export type YDBQuery = YDBSQLQuery | YDBBuilderQuery;

/**
 * These are options configured for each DataSource instance
 */
export interface YdbDataSourceOptions extends DataSourceJsonData {
  authKind: AuthenticationType;
  endpoint?: string;
  dbLocation?: string;
  user?: string;
}

export const YdbDataSourceOptionValues: Record<string, keyof YdbDataSourceOptions> = {
  authKind: 'authKind',
  endpoint: 'endpoint',
  dbLocation: 'dbLocation',
  user: 'user',
};

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface YdbSecureJsonData {
  serviceAccAuthAccessKey?: string;
  accessToken?: string;
  password?: string;
  certificate?: string;
}

export const YdbSecureOptions: Record<string, keyof YdbSecureJsonData> = {
  serviceAccAuthAccessKey: 'serviceAccAuthAccessKey',
  accessToken: 'accessToken',
  password: 'password',
  certificate: 'certificate',
};

export const AuthenticationOptions = {
  ServiceAccountKey: 'Service Account Key',
  AccessToken: 'Access Token',
  UserPassword: 'User/Password',
  MetaData: 'Metadata',
  Anonymous: 'Anonymous',
} as const;

export type AuthenticationType = keyof typeof AuthenticationOptions;

export function isValidConnectionType(type: unknown): type is AuthenticationType {
  if (Object.keys(AuthenticationOptions).some((el) => el === type)) {
    return true;
  }
  return false;
}

export type EditorProps = DataSourcePluginOptionsEditorProps<YdbDataSourceOptions, YdbSecureJsonData>;
