import React, { ChangeEvent } from 'react';
import {InlineField, InlineLabel, Input, RadioButtonGroup} from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { CertificationKey } from '../components/CertificationKey';
import {MyDataSourceOptions, MySecureJsonData} from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

export enum Connection {
  ServiceAccountKey = 0,
  CREDENTIALS = 1,
}

const types = [
  { label: 'Service Account Key', value: Connection.ServiceAccountKey },
  { label: 'Credentials', value: Connection.CREDENTIALS },
];

export const ConfigEditor: React.FC<Props> = (props) => {
  const { options, onOptionsChange } = props;
  const { jsonData, secureJsonFields } = options;
  const secureJsonData = (options.secureJsonData || {}) as MySecureJsonData;
  const hasKey = secureJsonFields && secureJsonFields.apiKey;
  const kind = jsonData.authKind || Connection.ServiceAccountKey;

  const onPathChange = (event: ChangeEvent<HTMLInputElement>) => {
    const jsonData = {
      ...options.jsonData,
      path: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  const onSettingChange =
      (setting: 'authKind' | 'path') =>
          (event: ChangeEvent<HTMLInputElement>) => {
            const { onOptionsChange, options } = props;
            const jsonData = {
              ...options.jsonData,
              [setting]: event.target.value,
            };
           onOptionsChange({ ...options, jsonData });
          };

  const onCertificateChangeFactory =  (key: keyof MySecureJsonData, value: string) => { //(key: string, value: string) => {
    onOptionsChange({
      ...options,
      secureJsonData: {
        ...secureJsonData,
        [key]: value,
      },
    });
  };

    const onResetClickFactory = (key: keyof MySecureJsonData) => {
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...secureJsonFields,
        [key]: false,
      },
      secureJsonData: {
        ...secureJsonData,
        [key]: '',
      },
    });
  };

  const setConnectionType = (type: number) => {
    onSettingChange('authKind')(asEvent(type));
  };

  return (
      <div className="gf-form-group">

        <div className="gf-form">
          <InlineLabel width={12}>Auth type</InlineLabel>
          <RadioButtonGroup options={types} value={kind} onChange={(v) => setConnectionType(v!)} size={'md'} />
        </div>

        {kind === Connection.ServiceAccountKey && (
            <>
              <div className="gf-form">
                <InlineField label="Path" labelWidth={12}>
                  <Input
                      onChange={onPathChange}
                      value={jsonData.path || ''}
                      placeholder="connection path"
                      width={40}
                  />
                </InlineField>
              </div>
              <CertificationKey
                  hasCert={!!hasKey}
                  value={secureJsonData.apiKey || ''}
                  onChange={(e) => onCertificateChangeFactory('apiKey', e.currentTarget.value)}
                  placeholder="Your key"
                  label={"Key"}
                  onClick={() => onResetClickFactory('apiKey')}
              />
            </>
        )}
      </div>
  );
}

const asEvent = (value: string | number): ChangeEvent<HTMLInputElement> => {
  return { target: { value } } as unknown as ChangeEvent<HTMLInputElement>;
};

