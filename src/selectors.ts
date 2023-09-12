import { E2ESelectors } from '@grafana/e2e-selectors';
export const Components = {
  QueryEditor: {
    Types: {
      label: 'Query Type',
      tooltip: 'Query Type',
      options: {
        SQLEditor: 'SQL Editor',
        QueryBuilder: 'Query Builder',
      },
      switcher: {
        title: 'Are you sure?',
        body: 'Query will be reset.',
        confirmText: 'Continue',
        dismissText: 'Cancel',
      },
    },
  },
  QueryBuilder: {
    Table: {
      label: 'Table',
      tooltip: 'YDB table to query from',
    },
    Fields: {
      label: 'Fields',
      tooltip: 'List of fields to show',
    },
    LogLineFields: {
      label: 'Log line',
      tooltip: 'List of fields to be combined into log line',
    },
    LogLevelField: {
      label: 'Log level field',
      tooltip: 'Select the field to extract log level information from',
    },
    LogTimeField: {
      Name: {
        label: 'Log time field',
        tooltip: 'Select field to extract log time information from',
      },
      Cast: { label: 'CAST AS', tooltip: 'Log time field should be a type of date time' },
    },
    Filter: {
      label: 'Filters',
      tooltip: 'List of filters',
      paramsPlaceholder: 'Select available or add yours',
    },
    OrderBy: {
      label: 'Order by',
      tooltip: 'Order by fields',
    },
    Aggregations: {
      label: 'Aggregations',
      tooltip: 'Aggregation functions to use',
    },
    GroupBy: {
      label: 'Group by',
      tooltip: 'Group the results by specific field',
    },
    Format: {
      label: 'Format',
      tooltip: 'Visualization type',
    },
    EditorHeight: {
      label: 'Editor height',
      tooltip: 'Default SQL editor height',
    },
    SqlPreview: {
      label: 'SQL Preview',
      tooltip: 'You can safely switch to SQL Editor to customize the generated query',
    },
    Limit: {
      label: 'Limit',
      tooltip: 'Number of records/results to show',
    },
  },
  ConfigEditor: {
    Endpoint: {
      label: 'Endpoint',
      placeholder: 'grpcs://ydb.serverless.yandexcloud.net:2135',
      tooltip: 'YDB endpoint address',
    },
    DBLocation: {
      label: 'Database',
      placeholder: '/eu-central1/b1g/etnudu2n',
      tooltip: 'YDB location address',
    },
    Certificate: {
      label: 'TLS/SSL Client Certificate',
      tooltip: 'To authenticate with an TLS/SSL client certificate, provide the certificate here',
      placeholder: 'Begins with -----BEGIN CERTIFICATE-----',
    },
    ServiceAccAuthAccessKey: {
      label: 'Service Account Key',
      placeholder:
        '{\n' +
        '   "id": "key_id",\n' +
        '   "service_account_id": "service_account_id",\n' +
        '   "created_at": "2019-03-20T10:04:56Z",\n' +
        '   "key_algorithm": "RSA_2048",\n' +
        '   "public_key": "-----BEGIN PUBLIC KEY-----\\n...\\n-----END PUBLIC KEY-----\\n",\n' +
        '   "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"\n' +
        '}\n',
      tooltip: 'Service account authorized access key',
    },
    AccessToken: {
      label: 'Access Token',
      placeholder: 'Enter IAM or Auth Token',
      tooltip: 'Access token: IAM Token, Auth token or others',
    },
    Password: {
      label: 'Password',
      placeholder: 'Password',
    },
    Username: {
      label: 'Username',
      placeholder: 'Username',
    },
  },
};
export const selectors: { components: E2ESelectors<typeof Components> } = {
  components: Components,
};
