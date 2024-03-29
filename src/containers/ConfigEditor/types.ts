import { DataSourcePluginOptionsEditorProps, DataSourceJsonData } from '@grafana/data';

export interface YdbDataSourceOptions extends DataSourceJsonData {
  authKind: AuthenticationType;
  endpoint?: string;
  dbLocation?: string;
  user?: string;
}

export const AuthenticationOptions = {
  ServiceAccountKey: 'Service Account Key',
  AccessToken: 'Access Token',
  UserPassword: 'User/Password',
  MetaData: 'Metadata',
  Anonymous: 'Anonymous',
} as const;

export type AuthenticationType = keyof typeof AuthenticationOptions;

/**
 * These are options configured for each DataSource instance
 */

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

export function isValidConnectionType(type: unknown): type is AuthenticationType {
  if (Object.keys(AuthenticationOptions).some((el) => el === type)) {
    return true;
  }
  return false;
}

export type EditorProps = DataSourcePluginOptionsEditorProps<YdbDataSourceOptions, YdbSecureJsonData>;
