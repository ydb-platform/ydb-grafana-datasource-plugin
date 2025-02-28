[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/ydb-platform/ydb-grafana-datasource-plugin/blob/main/LICENSE)
[![Telegram](https://img.shields.io/badge/chat-on%20Telegram-2ba2d9.svg)](https://t.me/ydb_en)
[![WebSite](https://img.shields.io/badge/website-ydb.tech-blue.svg)](https://ydb.tech)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/ydb-platform/ydb-grafana-datasource-plugin/blob/master/CONTRIBUTING.md)

# YDB data source for Grafana

The [YDB data source plugin](https://grafana.com/grafana/plugins/ydbtech-ydb-datasource/) allows you to use [Grafana](https://grafana.com) to query and visualize data from YDB.

## Installation

Prerequisites: the plugin requires Grafana v9.2 or higher.

Follow the Grafana's [plugin installation docs](https://grafana.com/docs/grafana/latest/plugins/installation/) to install a plugin named `ydb-grafana-datasource-plugin`.

## Configuration

### YDB user for the data sourcnote warning

Set up an YDB user account with **read-only** permissions [(more about permissions)](https://ydb.tech/docs/ru/security/authorization#right) and access to databases and tables you want to query.

Please note that Grafana does not validate that queries are safe. Queries can contain any SQL statements, including data modification instructions.

### Data transfer protocol support

The plugin supports [gRPC and gRPCS](https://grpc.io/) transport protocols.

### Configuration via UI

Once the plugin is installed on your Grafana instance, follow [these instructions](https://grafana.com/docs/grafana/latest/datasources/add-a-data-source/) to add a new YDB data source, and enter configuration options.

### Configuration with provisioning system

Alternatively, Grafana's provisioning system allows you to configure data sources using configuration files. To read about how it works, including all the settings you can set for this data source, refer to the [Provisioning Grafana data sources](https://grafana.com/docs/grafana/latest/administration/provisioning/#data-sources) documentation.

### Authentication

The Grafana plugin supports the following [authentication methods](https://ydb.tech/docs/reference/ydb-sdk/auth): Anonymous, Access Token, Metadata, Service Account Key and Static Credentials.

Below is an example config for authenticating a YDB data source using username and password:

```yaml
apiVersion: 1
datasources:
  - name: YDB
    type: ydbtech-ydb-datasource
    jsonData:
      authKind: 'UserPassword'
      endpoint: 'grpcs://<hostname>:2135'
      dbLocation: '<location_to_db>'
      user: '<username>'
    secureJsonData:
      password: '<userpassword>'
      certificate: |
        <full content of *.pem file>
```

Here are fields that are supported in connection configuration:

| Name                    | Description                                                                                                                                                                             |                                         Type                                          |
| :---------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-----------------------------------------------------------------------------------: |
| authKind                | Authentication type                                                                                                                                                                     | `"Anonymous"`, `"ServiceAccountKey"`, `"AccessToken"`, `"UserPassword"`, `"MetaData"` |
| endpoint                | Database endpoint                                                                                                                                                                       |                                       `string`                                        |
| dbLocation              | Database location                                                                                                                                                                       |                                       `string`                                        |
| user                    | User name                                                                                                                                                                               |                                       `string`                                        |
| serviceAccAuthAccessKey | Service account access key                                                                                                                                                              |                                  `string` (secured)                                   |
| accessToken             | Access token                                                                                                                                                                            |                                  `string` (secured)                                   |
| password                | User password                                                                                                                                                                           |                                  `string` (secured)                                   |
| certificate             | If self-signed certificates are used on your YDB cluster nodes, specify the [Certificate Authority](https://en.wikipedia.org/wiki/Certificate_authority) certificate used to issue them |                                  `string` (secured)                                   |

## Building queries

YDB is queried with a SQL dialect named [YQL](https://ydb.tech/docs/yql/reference).
The query editor allows to get data in different representations: time series, table, or logs.

### Time series

Time series visualization options are selectable if the query returns at least one field with `Date`, `Datetime`, or `Timestamp` type (for now, working with time is supported only in UTC timezone) and at least one field with `Int64`, `Int32`, `Int16`, `Int8`, `Uint64`, `Uint32`, `Uint16`, `Uint8`, `Double` or `Float` type. Then, you can select time series visualization options. Any other column is treated as a value column.

#### Multi-line time series

To create a multi-line time series, the query must return at least 3 fields:

- field with `Date`, `Datetime` or `Timestamp` type (for now, working with time is supported only in UTC timezone)
- metric - field with `Int64`, `Int32`, `Int16`, `Int8`, `Uint64`, `Uint32`, `Uint16`, `Uint8`, `Double` or `Float` type
- either metric or field with `String` or `Utf8` type - the value for splitting metrics into separate series.

For example:

```yql
SELECT
    `timestamp`,
    `responseStatus`
    AVG(`requestTime`) AS `avgReqTime`
FROM `/database/endpoint/my-logs`
GROUP BY `responseStatus`, `timestamp`
ORDER BY `timestamp`
```

For this kind of queries, using [column-oriented tables](https://ydb.tech/docs/concepts/datamodel/table#column-tables) will likely be beneficial in terms of performance.

### Tables { #tables }

Table visualizations will always be available for any valid YDB query that returns exactly one result set.

### Visualizing logs with the Logs Panel

To use the Logs panel, your query must return a `Date`, `Datetime`, or `Timestamp` value and a `String` value. You can select logs visualizations using the visualization options.

Only the first text field will be represented as a log line by default. This behavior can be customized using the query builder.

### Macros

The query can contain macros, which simplify syntax and allow for dynamic parts, like date range filters.
There are two kinds of macros - [Grafana-level](#macros) and YDB-level. The plugin will parse query text and, before sending it to YDB, substitute variables and Grafana-level macros with particular values. After that YDB-level macroses will be treated by YDB server-side.

Here is an example of a query with a macro that will use Grafana's time filter:

```yql
SELECT `timeCol`
FROM `/database/endpoint/my-logs`
WHERE $__timeFilter(`timeCol`)
```

```yql
SELECT `timeCol`
FROM `/database/endpoint/my-logs`
WHERE $__timeFilter(`timeCol` + Interval("PT24H"))
```

| Macro                                     | Description                                                                                                                                    | Output example                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `$__timeFilter(expr)`                     | Replaced by a conditional that filters the data (using the provided column or expression) based on the time range of the panel in microseconds | `foo >= CAST(1636717526371000 AS Timestamp) AND foo <=  CAST(1668253526371000 AS Timestamp)' )` |
| `$__fromTimestamp`                        | Replaced by the starting time of the range of the panel cast to Timestamp                                                                      | `CAST(1636717526371000 AS Timestamp)`                                                           |
| `$__toTimestamp`                          | Replaced by the ending time of the range of the panel cast to Timestamp                                                                        | `CAST(1636717526371000 AS Timestamp)`                                                           |
| `$__varFallback(condition, $templateVar)` | Replaced by the first parameter when the template variable in the second parameter is not provided.                                            | `$__varFallback('foo', $bar)` `foo` if variable `bar` is not provided, or `$bar`'s value        |

### Templates and variables

To add a new YDB query variable, refer to [Add a query variable](https://grafana.com/docs/grafana/latest/variables/variable-types/add-query-variable/).
After creating a variable, you can use it in your YDB queries by using [Variable syntax](https://grafana.com/docs/grafana/latest/variables/syntax/).
For more information about variables, refer to [Templates and variables](https://grafana.com/docs/grafana/latest/variables/).

## Learn more

- Add [Annotations](https://grafana.com/docs/grafana/latest/dashboards/annotations/).
- Configure and use [Templates and variables](https://grafana.com/docs/grafana/latest/variables/).
- Add [Transformations](https://grafana.com/docs/grafana/latest/panels/transformations/).
- Set up alerting; refer to [Alerts overview](https://grafana.com/docs/grafana/latest/alerting/).
