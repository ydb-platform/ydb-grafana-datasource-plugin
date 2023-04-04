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
    },
};
export const selectors: { components: E2ESelectors<typeof Components> } = {
    components: Components,
};
