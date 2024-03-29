[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/ydb-platform/ydb-grafana-datasource-plugin/blob/main/LICENSE)
[![Release](https://img.shields.io/badge/dynamic/json?logo=grafana&color=F47A20&label=release&prefix=v&query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22ydbtech-ydb-datasource%22%29%5D.version&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/ydbtech-ydb-datasource)
[![Downloads](https://img.shields.io/badge/dynamic/json?logo=grafana&color=F47A20&label=downloads&query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22ydbtech-ydb-datasource%22%29%5D.downloads&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/ydbtech-ydb-datasource)

<!-- ![Code lines](https://sloc.xyz/github/ydb-platform/ydb-grafana-datasource-plugin/?category=code) -->

[![Telegram](https://img.shields.io/badge/chat-on%20Telegram-2ba2d9.svg)](https://t.me/ydb_en)
[![WebSite](https://img.shields.io/badge/website-ydb.tech-blue.svg)](https://ydb.tech)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/ydb-platform/ydb-grafana-datasource-plugin/blob/master/CONTRIBUTING.md)

# YDB data source for Grafana

## Version compatibility

Plugin requires `v9.2` and higher of Grafana.

The YDB data source plugin allows you to query and visualize YDB data from within Grafana.

## Installation

For detailed instructions on how to install the plugin on Grafana Cloud or locally, please checkout the [Plugin installation docs](https://grafana.com/docs/grafana/latest/plugins/installation/).

## Configuration

### YDB user for the data source

Set up an YDB user account with readonly permission [(more about permissions)](https://ydb.tech/ru/docs/cluster/access) and access to databases and tables you want to query. Please note that Grafana does not validate that queries are safe. Queries can contain any SQL statement including modification instructions.

### Data transfer protocol support

The plugin supports `GRPCS` and `GRPC` transport protocols. Please note that you need to provide TLS/SSL certificate when using `grpcs`.

### Manual configuration

Once the plugin is installed on your Grafana instance, follow [these instructions](https://grafana.com/docs/grafana/latest/datasources/add-a-data-source/) to add a new YDB data source, and enter configuration options.

### With a configuration file

It is possible to configure data sources using configuration files with Grafana’s provisioning system. To read about how it works, including all the settings that you can set for this data source, refer to [Provisioning Grafana data sources](https://grafana.com/docs/grafana/latest/administration/provisioning/#data-sources).

Plugin supports different authentication types [authentication types](https://ydb.tech/ru/docs/reference/ydb-sdk/auth).

Here is an example for this data source using user/password:

```yaml
apiVersion: 1
datasources:
  - name: YDB
    type: ydbtech-ydb-datasource
    jsonData:
      authKind: "UserPassword",
      endpoint: 'grpcs://endpoint',
      dbLocation: 'location',
      user: 'username',
    secureJsonData:
      password: 'userpassword',
      certificate: 'certificate',
```

Here are fields that are supported in connection configuration:

```typescript
    jsonData:
      authKind: "Anonymous" | "ServiceAccountKey" | "AccessToken" | "UserPassword" | "MetaData";
      endpoint: string;
      dbLocation: string;
      user?: string;
    secureJsonData:
      serviceAccAuthAccessKey?: string;
      accessToken?: string;
      password?: string;
      certificate?: string;
```

## Building queries

[YQL dialect](https://ydb.tech/ru/docs/yql/reference/) is used to query YDB.
Queries can contain macros which simplify syntax and allow for dynamic parts.
The query editor allows you to get data in different representation: time series, table or logs.

### Time series

Time series visualization options are selectable after adding to your query one field with `Date`, `Datetime` or `Timestamp` type and at least one field with `number` type. You can select time series visualizations using the visualization options. Grafana interprets timestamp rows without explicit time zone as UTC. Any other column is treated as a value column.

#### Multi-line time series

To create multi-line time series, the query must return at least 3 fields in the following order:

- field 1: time field
- field 2: value to group by
- field 3+: the metric values

For example:

```sql
SELECT `timestamp`, `requestTime`, AVG(`responseStatus`) AS `avgRespStatus`
FROM `/database/endpoint/my-logs`
GROUP BY `requestTime`, `timestamp`
ORDER BY `timestamp`
```

### Tables

Table visualizations will always be available for any valid YDB query.

### Visualizing logs with the Logs Panel

To use the Logs panel your query must return a time and string values. You can select logs visualizations using the visualization options.

By default only the first text field will be represented as log line, but this can be customized using query builder.

### Macros

To simplify syntax and to allow for dynamic parts, like date range filters, the query can contain macros.

Here is an example of a query with a macro that will use Grafana's time filter:

```sql
SELECT `timeCol`
FROM `/database/endpoint/my-logs`
WHERE $__timeFilter(`timeCol`)
```

| Macro                                        | Description                                                                                                                      | Output example                                                                                  |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| _$\_\_timeFilter(columnName)_                | Replaced by a conditional that filters the data (using the provided column) based on the time range of the panel in microseconds | `foo >= CAST(1636717526371000 AS TIMESTAMP) AND foo <=  CAST(1668253526371000 AS TIMESTAMP)' )` |
| _$\_\_fromTimestamp_                         | Replaced by the starting time of the range of the panel casted to Timestamp                                                      | `CAST(1636717526371000 AS TIMESTAMP)`                                                           |
| _$\_\_toTimestamp_                           | Replaced by the ending time of the range of the panel casted to Timestamp                                                        | `CAST(1636717526371000 AS TIMESTAMP)`                                                           |
| _$\_\_varFallback(condition, \$templateVar)_ | Replaced by the first parameter when the template variable in the second parameter is not provided.                              | `condition` or `templateVarValue`                                                               |

### Templates and variables

To add a new YDB query variable, refer to [Add a query variable](https://grafana.com/docs/grafana/latest/variables/variable-types/add-query-variable/).
After creating a variable, you can use it in your YDB queries by using [Variable syntax](https://grafana.com/docs/grafana/latest/variables/syntax/).
For more information about variables, refer to [Templates and variables](https://grafana.com/docs/grafana/latest/variables/).

## Learn more

- Add [Annotations](https://grafana.com/docs/grafana/latest/dashboards/annotations/).
- Configure and use [Templates and variables](https://grafana.com/docs/grafana/latest/variables/).
- Add [Transformations](https://grafana.com/docs/grafana/latest/panels/transformations/).
- Set up alerting; refer to [Alerts overview](https://grafana.com/docs/grafana/latest/alerting/).
