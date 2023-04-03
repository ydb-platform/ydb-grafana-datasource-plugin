import React, { ChangeEvent } from 'react';
import { InlineField, InlineLabel, Input, RadioButtonGroup, SecretInput } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions, MySecureJsonData } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

export enum Connection {
  ServiceAccountKey = 0,
  CREDENTIALS = 1,
}

const types = [
  { label: 'Service Account Key', value: Connection.ServiceAccountKey },
  { label: 'Credentials', value: Connection.CREDENTIALS },
];

export function ConfigEditor(props: Props) {
  const { onOptionsChange, options } = props;
  const onPathChange = (event: ChangeEvent<HTMLInputElement>) => {
    const jsonData = {
      ...options.jsonData,
      path: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  const onSettingChange =
      (setting: 'uri' | 'authEndpoint' | 'authKind' | 'grpcEndpoint' | 'user') =>
          (event: ChangeEvent<HTMLInputElement>) => {
            const { onOptionsChange, options } = props;
            const jsonData = {
              ...options.jsonData,
              [setting]: event.target.value,
            };
            onOptionsChange({ ...options, jsonData });
          };


  // Secure field (only sent to the backend)
  const onAPIKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      secureJsonData: {
        apiKey: event.target.value,
      },
    });
  };

  const onResetAPIKey = () => {
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        apiKey: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        apiKey: '',
      },
    });
  };

  const setConnectionType = (type: number) => {
    onSettingChange('authKind')(asEvent(type));
  };

  const { jsonData, secureJsonFields } = options;
  const secureJsonData = (options.secureJsonData || {}) as MySecureJsonData;

  const kind = jsonData.authKind || Connection.ServiceAccountKey;

  return (
      <div className="gf-form-group">

        <div className="gf-form">
          <InlineLabel width={12}>Auth type</InlineLabel>
          <RadioButtonGroup options={types} value={kind} onChange={(v) => setConnectionType(v!)} size={'md'} />
        </div>

        <InlineField label="Path" labelWidth={12}>
          <Input
              onChange={onPathChange}
              value={jsonData.path || ''}
              placeholder="json field returned to frontend"
              width={40}
          />
        </InlineField>
        <InlineField label="API Key" labelWidth={12}>
          <SecretInput
              isConfigured={(secureJsonFields && secureJsonFields.apiKey) as boolean}
              value={secureJsonData.apiKey || ''}
              placeholder="secure json field (backend only)"
              width={40}
              onReset={onResetAPIKey}
              onChange={onAPIKeyChange}
          />
        </InlineField>
      </div>
  );
}

const asEvent = (value: string | number): ChangeEvent<HTMLInputElement> => {
  return { target: { value } } as unknown as ChangeEvent<HTMLInputElement>;
};

