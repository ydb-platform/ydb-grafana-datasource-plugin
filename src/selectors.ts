import { E2ESelectors } from '@grafana/e2e-selectors';
export const Components = {
    ConfigEditor: {
        Endpoint: {
            label: 'Endpoint',
            placeholder: 'grpcs://ydb.serverless.yandexcloud.net:2135',
            tooltip: 'YDB endpoint address',
        },
        DBLocation: {
            label: 'DB',
            placeholder: '/eu-central1/b1g/etnudu2n',
            tooltip: 'YDB location address',
        },
        ServiceAccAuthAccessKey: {
            label: 'Service Account Key',
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
        AccessToken: {
            label: 'Access Token',
            placeholder: 'Example of IAM Token: "t1.7euelSbPyceKx87JqpuRl1qZiY-Ryi3rnpWaksrKaZqUppnLncmDnpeajZvl8_dZNAFl-e8ENXMH_t3z9xljfmT57wQ1cwf-.-LErty1vRh4S__VEp-aDnM5huB5MEfm_Iu1u2IzNgyrn0emiWDYA6rSQXDvzjE0O3HBbUlqoDeCmXYYInzZ6Cg"\n\n' +
                'Example of Auth Token: "y3_Vdheub7w9bIut67GHeL345gfb5GAnd3dZnf08FRbvjeUFvetYiohGvc"\n\n'+
                'Enter only one of the tokens',
            tooltip: 'Access token: IAM Token, Auth token or others',
        },
    },
};
export const selectors: { components: E2ESelectors<typeof Components> } = {
    components: Components,
};
