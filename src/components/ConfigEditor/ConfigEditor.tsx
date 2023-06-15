import * as React from 'react';
import { RadioButtonGroup, FieldSet, InlineField, Input, SecretTextArea, SecretInput } from '@grafana/ui';
import {
  onUpdateDatasourceJsonDataOption,
  onUpdateDatasourceJsonDataOptionSelect,
  onUpdateDatasourceSecureJsonDataOption,
  updateDatasourcePluginResetOption,
} from '@grafana/data';

import {
  AuthenticationOptions,
  YdbDataSourceOptionValues,
  YdbSecureJsonData,
  isValidConnectionType,
  AuthenticationType,
  YdbSecureOptions,
  EditorProps,
} from './types';

import { Components } from 'selectors';

const defaultLabelWidth = 25;
const defaultInputWidth = 40;
const defaultTextAreaWidth = 100;

const ConnectionTypesValues = Object.entries(AuthenticationOptions).map(([key, value]) => ({
  label: value,
  value: key as AuthenticationType,
}));

export const ConfigEditor = (props: EditorProps) => {
  const { options } = props;
  const { jsonData, secureJsonFields = {} } = options;
  const secureJsonData: YdbSecureJsonData = options.secureJsonData ?? {};
  const kind = isValidConnectionType(jsonData.authKind) ? jsonData.authKind : 'ServiceAccountKey';

  const showCert = jsonData.endpoint?.startsWith('grpcs://');

  return (
    <React.Fragment>
      <FieldSet label="Connection">
        <InlineField
          label={Components.ConfigEditor.Endpoint.label}
          tooltip={Components.ConfigEditor.Endpoint.tooltip}
          labelWidth={defaultLabelWidth}
          required
        >
          <Input
            name={YdbDataSourceOptionValues.endpoint}
            value={jsonData.endpoint}
            placeholder={Components.ConfigEditor.Endpoint.placeholder}
            width={defaultInputWidth}
            onChange={onUpdateDatasourceJsonDataOption(props, YdbDataSourceOptionValues.endpoint)}
          />
        </InlineField>
        <InlineField
          required
          labelWidth={defaultLabelWidth}
          label={Components.ConfigEditor.DBLocation.label}
          tooltip={Components.ConfigEditor.DBLocation.tooltip}
        >
          <Input
            name={YdbDataSourceOptionValues.dbLocation}
            value={jsonData.dbLocation}
            placeholder={Components.ConfigEditor.DBLocation.placeholder}
            width={defaultInputWidth}
            onChange={onUpdateDatasourceJsonDataOption(props, YdbDataSourceOptionValues.dbLocation)}
          />
        </InlineField>
        {showCert && (
          <InlineField
            tooltip={Components.ConfigEditor.Certificate.tooltip}
            label={Components.ConfigEditor.Certificate.label}
            labelWidth={defaultLabelWidth}
          >
            <SecretTextArea
              rows={3}
              cols={defaultTextAreaWidth}
              onReset={() => updateDatasourcePluginResetOption(props, YdbSecureOptions.certificate)}
              isConfigured={Boolean(secureJsonFields.certificate)}
              value={secureJsonData.certificate}
              onChange={onUpdateDatasourceSecureJsonDataOption(props, YdbSecureOptions.certificate)}
              placeholder={Components.ConfigEditor.Certificate.placeholder}
            />
          </InlineField>
        )}
      </FieldSet>
      <FieldSet label="Credentials">
        <InlineField label="Authentication type" labelWidth={defaultLabelWidth}>
          <RadioButtonGroup
            options={ConnectionTypesValues}
            value={kind}
            onChange={(v) =>
              onUpdateDatasourceJsonDataOptionSelect(props, YdbDataSourceOptionValues.authKind)({ value: v })
            }
            size={'md'}
          />
        </InlineField>
      </FieldSet>
      <div className="gf-form-group">
        {kind === 'ServiceAccountKey' && (
          <InlineField
            tooltip={Components.ConfigEditor.ServiceAccAuthAccessKey.tooltip}
            label={Components.ConfigEditor.ServiceAccAuthAccessKey.label}
            labelWidth={defaultLabelWidth}
          >
            <SecretTextArea
              rows={10}
              cols={defaultTextAreaWidth}
              onReset={() => updateDatasourcePluginResetOption(props, YdbSecureOptions.serviceAccAuthAccessKey)}
              isConfigured={Boolean(secureJsonFields.serviceAccAuthAccessKey)}
              value={secureJsonData.serviceAccAuthAccessKey}
              onChange={onUpdateDatasourceSecureJsonDataOption(props, YdbSecureOptions.serviceAccAuthAccessKey)}
              placeholder={Components.ConfigEditor.ServiceAccAuthAccessKey.placeholder}
            />
          </InlineField>
        )}
        {kind === 'AccessToken' && (
          <InlineField
            tooltip={Components.ConfigEditor.AccessToken.tooltip}
            label={Components.ConfigEditor.AccessToken.label}
            labelWidth={defaultLabelWidth}
          >
            <SecretTextArea
              rows={3}
              cols={defaultTextAreaWidth}
              onReset={() => updateDatasourcePluginResetOption(props, YdbSecureOptions.accessToken)}
              isConfigured={Boolean(secureJsonFields.accessToken)}
              value={secureJsonData.accessToken}
              onChange={onUpdateDatasourceSecureJsonDataOption(props, YdbSecureOptions.accessToken)}
              placeholder={Components.ConfigEditor.AccessToken.placeholder}
            />
          </InlineField>
        )}
        {kind === 'UserPassword' && (
          <React.Fragment>
            <InlineField label={Components.ConfigEditor.Username.label} labelWidth={defaultLabelWidth}>
              <Input
                required
                name={YdbDataSourceOptionValues.user}
                value={jsonData.user}
                placeholder={Components.ConfigEditor.Username.placeholder}
                width={defaultInputWidth}
                onChange={onUpdateDatasourceJsonDataOption(props, YdbDataSourceOptionValues.user)}
              />
            </InlineField>
            <InlineField labelWidth={defaultLabelWidth} label={Components.ConfigEditor.Password.label}>
              <SecretInput
                type="password"
                onReset={() => updateDatasourcePluginResetOption(props, YdbSecureOptions.password)}
                isConfigured={Boolean(secureJsonFields.password)}
                value={secureJsonData.password}
                placeholder={Components.ConfigEditor.Password.placeholder}
                width={defaultInputWidth}
                onChange={onUpdateDatasourceSecureJsonDataOption(props, YdbSecureOptions.password)}
              />
            </InlineField>
          </React.Fragment>
        )}
      </div>
    </React.Fragment>
  );
};
