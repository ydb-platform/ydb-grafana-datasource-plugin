package plugin

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"path"
	"strconv"
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

func createDatabaseConnection(ctx context.Context, settings *models.Settings) (*ydb.Driver, error) {
	var db *ydb.Driver
	var err error
	if settings.IsSecureConnection && settings.Secrets.Certificate != "" {
		db, err = createDBConnectionWithCert(ctx, settings)
	}
	db, err = createDBConnectionWithoutCert(ctx, settings)
	if err != nil {
		return nil, err
	}
	return db, nil
}

func createDBConnectionWithCert(ctx context.Context, settings *models.Settings) (*ydb.Driver, error) {
	creds := getCreds(settings)
	return ydb.Open(ctx, settings.Dsn, ydb.WithCertificatesFromPem([]byte(settings.Secrets.Certificate)), creds)
}

func createDBConnectionWithoutCert(ctx context.Context, settings *models.Settings) (*ydb.Driver, error) {
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
func (h *Ydb) Connect(config backend.DataSourceInstanceSettings, message json.RawMessage) (*sql.DB, error) {
	settings, err := models.LoadSettings(config)
	if err != nil {
		return nil, err
	}
	t, err := strconv.Atoi(settings.Timeout)
	if err != nil {
		return nil, fmt.Errorf("invalid timeout: %s", settings.Timeout)
	}

	timeout := time.Duration(t)
	ctx, cancel := context.WithTimeout(context.Background(), timeout*time.Second)
	defer cancel()

	ydbDriver, err := createDatabaseConnection(ctx, settings)

	if err != nil {
		log.DefaultLogger.Error("Connection with database failed", err)
	}

	connector, err := ydb.Connector(ydbDriver)
	if err != nil {
	log.DefaultLogger.Error("Connection with database failed", err)
	}
	db := sql.OpenDB(connector)
	ydbErr := make(chan error, 1)
	go func() {
		err = db.PingContext(ctx)
		ydbErr <- err
	}()

	select {
	case err := <-ydbErr:
		if err != nil {
			// sql ds will ping again and show error
			if exception, ok := err.(ydb.Error); ok {
				log.DefaultLogger.Error("[%d] %s", exception.Code(), exception.Name())
			} else {
				log.DefaultLogger.Error(err.Error())
			}
			return db, nil
		}
	case <-time.After(timeout * time.Second):
		return db, errors.New("connection timed out")
	}

	return db, nil
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