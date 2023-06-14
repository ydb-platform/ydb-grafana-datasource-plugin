package plugin

import (
	"context"
	"database/sql"
	"encoding/json"
	"path"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana-plugin-sdk-go/data/sqlutil"
	"github.com/grafana/sqlds/v2"
	"github.com/ydb-platform/ydb-go-sdk/v3"
	"github.com/ydb-platform/ydb-go-sdk/v3/scheme"
	"github.com/ydb-platform/ydb-go-sdk/v3/table/options"
	"github.com/ydb-platform/ydb-go-sdk/v3/table/result"
	"github.com/ydb-platform/ydb-go-sdk/v3/table/types"
	yc "github.com/ydb-platform/ydb-go-yc"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"

	"github.com/ydb/grafana-ydb-datasource/pkg/converters"
	"github.com/ydb/grafana-ydb-datasource/pkg/macros"
	"github.com/ydb/grafana-ydb-datasource/pkg/models"
)

func createDriver(ctx context.Context, settings *models.Settings) (db *ydb.Driver, err error) {
	if settings.IsSecureConnection && settings.Secrets.Certificate != "" {
		return createDriverWithCert(ctx, settings)
	}
	return createDriverWithoutCert(ctx, settings)
}

func createDriverWithCert(ctx context.Context, settings *models.Settings) (*ydb.Driver, error) {
	creds := getCreds(settings)
	return ydb.Open(ctx, settings.Dsn, ydb.WithCertificatesFromPem([]byte(settings.Secrets.Certificate)), creds)
}

func createDriverWithoutCert(ctx context.Context, settings *models.Settings) (*ydb.Driver, error) {
	creds := getCreds(settings)
	return ydb.Open(ctx, settings.Dsn, creds)
}

func getCreds(settings *models.Settings) ydb.Option {
	switch settings.AuthKind {
	case "ServiceAccountKey":
		return yc.WithServiceAccountKeyCredentials(settings.Secrets.ServiceAccAuthAccessKey)
	case "AccessToken":
		return ydb.WithAccessTokenCredentials(settings.Secrets.AccessToken)
	case "UserPassword":
		return ydb.WithStaticCredentials(settings.User, settings.Secrets.Password)
	case "MetaData":
		return yc.WithMetadataCredentials()
	}
	return ydb.WithAnonymousCredentials()
}

// Ydb defines how to connect to a Ydb datasource
type Ydb struct{}

// listTables returns list of all tables includes folder tables
func listTables(ctx context.Context, db *ydb.Driver, folder string) (tables []string, _ error) {
	dir, err := db.Scheme().ListDirectory(ctx, folder)
	if err != nil {
		return nil, err
	}
	for _, entity := range dir.Children {
		entityPath := path.Join(folder, entity.Name)
		switch entity.Type {
		case scheme.EntryTable, scheme.EntryColumnTable:
			tables = append(tables, entityPath)
		case scheme.EntryDirectory:
			entityTables, err := listTables(ctx, db, entityPath)
			if err != nil {
				return nil, err
			}
			tables = append(tables, entityTables...)
		}
	}
	return tables, nil
}

func RetrieveListTablesForRoot(config backend.DataSourceInstanceSettings) (respData []byte, err error) {
	defer func() {
		if err != nil {
			log.DefaultLogger.Error("Getting table list failed", err.Error())
		}
	}()
	settings, err := models.LoadSettings(config)
	if err != nil {
		return nil, err
	}
	connectionCtx, connectionCancel := context.WithTimeout(context.Background(), settings.TimeoutDuration)
	defer connectionCancel()

	ydbDriver, err := createDriver(connectionCtx, settings)
	data, err := listTables(connectionCtx, ydbDriver, ydbDriver.Name())
	if err != nil {
		return nil, err
	}
	return json.Marshal(data)
}

func resultSetMeta(resultSet result.Set) (meta map[string]types.Type) {
	meta = make(map[string]types.Type, resultSet.ColumnCount())
	resultSet.Columns(func(column options.Column) {
		meta[column.Name] = column.Type
	})
	return meta
}

type queryModel struct {
	RawSql string `json:"rawSql"`
}

// func (d *Datasource) query(ctx context.Context, pCtx backend.PluginContext, query backend.DataQuery) backend.DataResponse {
// 	log.DefaultLogger.Info("query called", query.JSON)
// 	var parsedQuery queryModel

// 	queryUnmarshalError := json.Unmarshal(query.JSON, &parsedQuery)
// 	if queryUnmarshalError != nil {
// 		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("json unmarshal: %v", queryUnmarshalError.Error()))
// 	}
// 	log.DefaultLogger.Info("query unmarshalled", parsedQuery.RawSql)

// 	var response backend.DataResponse
// 	var (
// 		readTx = table.TxControl(
// 			table.BeginTx(
// 				table.WithOnlineReadOnly(),
// 			),
// 			table.CommitTx(),
// 		)
// 	)
// 	err := d.driver.Table().Do(ctx,
// 		func(ctx context.Context, s table.Session) (err error) {
// 			var (
// 				res result.Result
// 				// id    uint64 // a variable for required results
// 				// title *string // a pointer for optional results
// 				// date  *time.Time // a pointer for optional results
// 			)
// 			_, res, err = s.Execute(
// 				ctx,
// 				readTx,
// 				parsedQuery.RawSql,
// 				table.NewQueryParameters(),
// 			)
// 			if err != nil {
// 				return err
// 			}
// 			defer res.Close() // result must be closed
// 			log.DefaultLogger.Info("> select_simple_transaction:\n", res)
// 			for res.NextResultSet(ctx) {
// 				meta := resultSetMeta(res.CurrentResultSet())
// 				row := make([]named.Value, 0, len(meta))
// 				for name := range meta {
// 					var value types.Value
// 					row = append(row, named.Optional(name, &value))
// 				}

// 				for res.NextRow() {
// 					err = res.ScanNamed(row...)
// 					if err != nil {
// 						return err
// 					}
// 					logArgs := make([]interface{}, 0, len(meta))
// 					for name, value := range row {
// 						logArgs = append(logArgs, fmt.Sprintf("%d: %v", name, value.Value))
// 					}
// 					log.DefaultLogger.Info("  > row:", logArgs...)
// 				}
// 			}
// 			return res.Err()
// 		},
// 	)
// 	if err != nil {
// 		// handle a query execution error
// 	}

// 	// create data frame response.
// 	// For an overview on data frames and how grafana handles them:
// 	// https://grafana.com/docs/grafana/latest/developers/plugins/data-frames/

// 	// frame := data.NewFrame("response")

// 	// // add fields.
// 	// frame.Fields = append(frame.Fields,
// 	// 	data.NewField("time", nil, []time.Time{query.TimeRange.From, query.TimeRange.To}),
// 	// 	data.NewField("values", nil, []int64{10, 20}),
// 	// )

// 	// // add the frames to the response.
// 	// response.Frames = append(response.Frames, frame)

// 	return response
// }


func (h *Ydb) Settings(config backend.DataSourceInstanceSettings) sqlds.DriverSettings {
	timeout := 60
	return sqlds.DriverSettings{
		Timeout: time.Second * time.Duration(timeout),
		FillMode: &data.FillMissing{
			Mode: data.FillModeNull,
		},
	}
}

// Connect opens a sql.DB connection using datasource settings
func (h *Ydb) Connect(config backend.DataSourceInstanceSettings, message json.RawMessage) (_ *sql.DB, err error) {
	defer func() {
		if err != nil {
			log.DefaultLogger.Error("Connection with database failed", err.Error())
		}
	}()
	settings, err := models.LoadSettings(config)
	if err != nil {
		return nil, err
	}
	connectionCtx, connectionCancel := context.WithTimeout(context.Background(), settings.TimeoutDuration)
	defer connectionCancel()

	ydbDriver, err := createDriver(connectionCtx, settings)

	connector, err := ydb.Connector(ydbDriver, ydb.WithAutoDeclare(),
	ydb.WithNumericArgs(), ydb.WithPositionalArgs())
	db := sql.OpenDB(connector)

	return db, db.PingContext(connectionCtx)
}

// Converters defines list of data type converters
func (h *Ydb) Converters() []sqlutil.Converter {
	return converters.YdbConverters
}

// Macros returns list of macro functions convert the macros of raw query
func (h *Ydb) Macros() sqlds.Macros {
	return map[string]sqlds.MacroFunc{
		"fromTime":      macros.FromTimeFilter,
		"toTime":        macros.ToTimeFilter,
		"timeFilter_ms": macros.TimeFilterMs,
		"timeFilter":    macros.TimeFilter,
		"dateFilter":    macros.DateFilter,
		"timeInterval":  macros.TimeInterval,
		"interval_s":    macros.IntervalSeconds,
	}
}