import React, { ChangeEvent } from 'react';
import {LegacyForms, InlineLabel, RadioButtonGroup} from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps, onUpdateDatasourceJsonDataOption } from '@grafana/data';
import { CertificationKey } from './CertificationKey';
import {MyDataSourceOptions, MySecureJsonData} from '../types';
import { Components } from './../selectors';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

export enum Connection {
  ServiceAccountKey = 0,
  AccessToken = 1,
  UserPassword = 2,
  MetaData = 3,
  Anonymous = 4
}

const types = [
  { label: 'Service Account Key', value: Connection.ServiceAccountKey },
  { label: 'Access Token', value: Connection.AccessToken },
  { label: 'User/Pass', value: Connection.UserPassword },
  { label: 'Metadata', value: Connection.MetaData },
  { label: 'Anonymous', value: Connection.Anonymous },
];

export const ConfigEditor: React.FC<Props> = (props) => {
  const { options, onOptionsChange } = props;
  const { jsonData, secureJsonFields } = options;
  const secureJsonData = (options.secureJsonData || {}) as MySecureJsonData;
  const hasKey = secureJsonFields && secureJsonFields.serviceAccAuthAccessKey;
  const hasToken = secureJsonFields && secureJsonFields.accessToken;
  const kind = jsonData.authKind || Connection.ServiceAccountKey;
  const { FormField } = LegacyForms;

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

  const onCertificateChangeFactory =  (key: keyof MySecureJsonData, value: string) => {
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
      <>
        <div className="gf-form-group">
        <h3>Data base location</h3>
        <br/>
        <div className="gf-form">
          <FormField
              name="Endpoint"
              labelWidth={12}
              inputWidth={20}
              value={jsonData.endpoint || ''}
              onChange={onUpdateDatasourceJsonDataOption(props, 'endpoint')}
              label={Components.ConfigEditor.Endpoint.label}
              aria-label={Components.ConfigEditor.Endpoint.label}
              placeholder={Components.ConfigEditor.Endpoint.placeholder}
              tooltip={Components.ConfigEditor.Endpoint.tooltip}
          />
        </div>
        <div className="gf-form">
          <FormField
              name="Location"
              labelWidth={12}
              inputWidth={20}
              value={jsonData.dbLocation || ''}
              onChange={onUpdateDatasourceJsonDataOption(props, 'dbLocation')}
              label={Components.ConfigEditor.DBLocation.label}
              aria-label={Components.ConfigEditor.DBLocation.label}
              placeholder={Components.ConfigEditor.DBLocation.placeholder}
              tooltip={Components.ConfigEditor.DBLocation.tooltip}
          />
        </div>
        </div>
        <div className="gf-form-group">
        <h3>Credentials</h3>
        <br/>
        <div className="gf-form">
          <InlineLabel width={24}>Auth type</InlineLabel>
          <RadioButtonGroup options={types} value={kind} onChange={(v) => setConnectionType(v!)} size={'md'} />
        </div>
        {kind === Connection.ServiceAccountKey && (
            <>
              <CertificationKey
                  hasCert={!!hasKey}
                  value={secureJsonData.serviceAccAuthAccessKey || ''}
                  onChange={(e) => onCertificateChangeFactory('serviceAccAuthAccessKey', e.currentTarget.value)}
                  label={Components.ConfigEditor.ServiceAccAuthAccessKey.label}
                  tooltip={Components.ConfigEditor.ServiceAccAuthAccessKey.tooltip}
                  placeholder={Components.ConfigEditor.ServiceAccAuthAccessKey.placeholder}
                  onClick={() => onResetClickFactory('serviceAccAuthAccessKey')}
              />
            </>
        )}
          {kind === Connection.AccessToken && (
              <>
                <CertificationKey
                    hasCert={!!hasToken}
                    value={secureJsonData.accessToken || ''}
                    onChange={(e) => onCertificateChangeFactory('accessToken', e.currentTarget.value)}
                    label={Components.ConfigEditor.AccessToken.label}
                    tooltip={Components.ConfigEditor.AccessToken.tooltip}
                    placeholder={Components.ConfigEditor.AccessToken.placeholder}
                    onClick={() => onResetClickFactory('accessToken')}
                />
              </>
          )}
        </div>
      </>
  );
}

const asEvent = (value: string | number): ChangeEvent<HTMLInputElement> => {
  return { target: { value } } as unknown as ChangeEvent<HTMLInputElement>;
};

