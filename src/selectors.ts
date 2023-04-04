import { E2ESelectors } from '@grafana/e2e-selectors';
export const Components = {
    ConfigEditor: {
        Endpoint: {
            label: 'Endpoint',
            placeholder: 'grpcs://ydb.serverless.yandexcloud.net:2135',
            tooltip: 'YDB endpoint address',
        },
        DBLocation: {
            label: 'Location',
            placeholder: '/eu-central1/b1g/etnudu2n',
            tooltip: 'YDB location address',
        },
        ServiceAccAuthAccessKey: {
            label: 'Key',
            placeholder: '{\n' +
                '   "id": "lfkoe35hsk58aks301nl",\n' +
                '   "service_account_id": "ajepg0mjt06siua65usm",\n' +
                '   "created_at": "2019-03-20T10:04:56Z",\n' +
                '   "key_algorithm": "RSA_2048",\n' +
                '   "public_key": "-----BEGIN PUBLIC KEY-----\\n...\\n-----END PUBLIC KEY-----\\n",\n' +
                '   "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"\n' +
                '}\n',
            tooltip: 'Service account authorized access key',
        },
    },
};
export const selectors: { components: E2ESelectors<typeof Components> } = {
    components: Components,
};
