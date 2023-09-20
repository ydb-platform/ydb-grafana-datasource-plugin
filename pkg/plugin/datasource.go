package plugin

import (
	"context"
	"database/sql"
	"encoding/json"
	"path"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana-plugin-sdk-go/data/sqlutil"
	"github.com/grafana/sqlds/v2"
	"github.com/ydb-platform/ydb-go-sdk/v3"
	"github.com/ydb-platform/ydb-go-sdk/v3/scheme"
	"github.com/ydb-platform/ydb-go-sdk/v3/table"
	"github.com/ydb-platform/ydb-go-sdk/v3/table/options"
	"github.com/ydb-platform/ydb-go-sdk/v3/table/result"
	"github.com/ydb-platform/ydb-go-sdk/v3/table/types"
	yc "github.com/ydb-platform/ydb-go-yc"

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

// Ydb defines how to connect to a YDB datasource
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

func RetrieveListTablesForRoot(ctx context.Context, config backend.DataSourceInstanceSettings) (respData []byte, err error) {
	defer func() {
		if err != nil {
			log.DefaultLogger.Error("Getting table list failed", "error", err.Error())
		}
	}()

	settings, err := models.LoadSettings(config)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(ctx, settings.TimeoutDuration)
	defer cancel()

	ydbDriver, err := createDriver(ctx, settings)
	if err != nil {
		return nil, err
	}
	data, err := listTables(ctx, ydbDriver, ydbDriver.Name())
	if err != nil {
		return nil, err
	}
	
	return json.Marshal(data)
}

type TableField struct {
	Name string
	Type string
}

func listFields(ctx context.Context, db *ydb.Driver, tableName string) (fields []TableField, _ error) {
	err := db.Table().Do(ctx,
		func(ctx context.Context, s table.Session) (err error) {
			desc, err := s.DescribeTable(ctx, tableName)
			if err != nil {
				return
			}
			for _, c := range desc.Columns {
				var field TableField
				field.Name = c.Name
				field.Type = c.Type.Yql()
				fields = append(fields, field)
			}
			return
		},
	)
	if err != nil {
		return nil, err
	}
	return fields, nil
}

func RetrieveTableFields(ctx context.Context, config backend.DataSourceInstanceSettings, tableName string) (respData []byte, err error) {
	defer func() {
		if err != nil {
			log.DefaultLogger.Error("Getting fields failed", "error", err.Error())
		}
	}()

	settings, err := models.LoadSettings(config)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(ctx, settings.TimeoutDuration)
	defer cancel()

	ydbDriver, err := createDriver(ctx, settings)
	if err != nil {
		return nil, err
	}

	fields, err := listFields(ctx, ydbDriver, tableName)
	if err != nil {
		return nil, err
	}

	return json.Marshal(fields)
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
			log.DefaultLogger.Error("Connection with database failed", "error", err.Error())
		}
	}()
	settings, err := models.LoadSettings(config)
	if err != nil {
		return nil, err
	}
	connectionCtx, connectionCancel := context.WithTimeout(context.Background(), settings.TimeoutDuration)
	defer connectionCancel()

	ydbDriver, err := createDriver(connectionCtx, settings)
	if err != nil {
		return nil, err
	}

	connector, err := ydb.Connector(ydbDriver, ydb.WithAutoDeclare(),
		ydb.WithNumericArgs(), ydb.WithPositionalArgs(), ydb.WithDefaultQueryMode(ydb.ScanQueryMode))
	if err != nil {
		return nil, err
	}
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
		"fromTimestamp": macros.FromTimestampFilter,
		"toTimestamp":   macros.ToTimestampFilter,
		"timeFilter":    macros.TimestampFilter,
		"varFallback":   macros.VariableFallback,
	}
}
