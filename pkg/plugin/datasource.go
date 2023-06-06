package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/ydb/grafana-ydb-datasource/pkg/models"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/ydb-platform/ydb-go-sdk/v3"
	"github.com/ydb-platform/ydb-go-sdk/v3/table"
	"github.com/ydb-platform/ydb-go-sdk/v3/table/result"
	yc "github.com/ydb-platform/ydb-go-yc"
	// "github.com/ydb-platform/ydb-go-sdk/v3/balancers"
)

// Make sure Datasource implements required interfaces. This is important to do
// since otherwise we will only get a not implemented error response from plugin in
// runtime. In this example datasource instance implements backend.QueryDataHandler,
// backend.CheckHealthHandler interfaces. Plugin should not implement all these
// interfaces- only those which are required for a particular task.
var (
	_ backend.QueryDataHandler      = (*Datasource)(nil)
	_ backend.CheckHealthHandler    = (*Datasource)(nil)
	_ instancemgmt.InstanceDisposer = (*Datasource)(nil)
)

// NewDatasource creates a new datasource instance.
func NewDatasource(dis backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	settings, err := models.LoadSettings(dis)
	if err != nil {
		return nil, err
	}

	return &Datasource{
		CallResourceHandler: newResourceHandler(),
		settings:            settings,
	}, nil
}

func (d *Datasource) CreateDatabaseConnection(ctx context.Context) (error) {
	var db *ydb.Driver
	var err error
	if d.settings.IsSecureConnection && d.settings.Secrets.Certificate != "" {
		db, err = d.createDBConnectionWithCert(ctx)
	}
	db, err = d.createDBConnectionWithoutCert(ctx)
	if err != nil {
		return err
	}
	d.driver = db
	return nil
}

func (d *Datasource) createDBConnectionWithCert(ctx context.Context) (*ydb.Driver, error) {
	creds := getCreds(d.settings)
	return ydb.Open(ctx, d.settings.Dsn, ydb.WithCertificatesFromPem([]byte(d.settings.Secrets.Certificate)), creds)
}

func (d *Datasource) createDBConnectionWithoutCert(ctx context.Context) (*ydb.Driver, error) {
	creds := getCreds(d.settings)
	return ydb.Open(ctx, d.settings.Dsn, creds)
}

func getCreds(settings *models.Settings) (ydb.Option) {
	switch  settings.AuthKind {
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

// Datasource is an example datasource which can respond to data queries, reports
// its health and has streaming skills.
type Datasource struct {
	backend.CallResourceHandler
	settings *models.Settings
	driver *ydb.Driver
}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a new instance
// created. As soon as datasource settings change detected by SDK old datasource instance will
// be disposed and a new one will be created using NewSampleDatasource factory function.
func (d *Datasource) Dispose() {
	// Clean up datasource instance resources.
}

// QueryData handles multiple queries and returns multiple responses.
// req contains the queries []DataQuery (where each query contains RefID as a unique identifier).
// The QueryDataResponse contains a map of RefID to the response for each query, and each response
// contains Frames ([]*Frame).
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	// when logging at a non-Debug level, make sure you don't include sensitive information in the message
	// (like the *backend.QueryDataRequest)
	log.DefaultLogger.Info("QueryData called", "numQueries", len(req.Queries))

	if (d.driver == nil) {
		err := d.CreateDatabaseConnection(ctx)
		if (err != nil) {
			return nil, err
		}
	}

	// create response struct
	response := backend.NewQueryDataResponse()

	// loop over queries and execute them individually.
	for _, q := range req.Queries {
		res := d.query(ctx, req.PluginContext, q)

		// save the response in a hashmap
		// based on with RefID as identifier
		response.Responses[q.RefID] = res
	}
	log.DefaultLogger.Info("QueryData response", response)

	return response, nil
}

type queryModel struct {
	RawSql string `json:"rawSql"`
}

func (d *Datasource) query(ctx context.Context, pCtx backend.PluginContext, query backend.DataQuery) backend.DataResponse {
	log.DefaultLogger.Info("query called", query.JSON)
	var parsedQuery queryModel

	queryUnmarshalError := json.Unmarshal(query.JSON, &parsedQuery)
	if queryUnmarshalError != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("json unmarshal: %v", queryUnmarshalError.Error()))
	}
	log.DefaultLogger.Info("query unmarshalled", parsedQuery.RawSql)

	var response backend.DataResponse
	var (
		readTx = table.TxControl(
		  table.BeginTx(
			table.WithOnlineReadOnly(),
		  ),
		  table.CommitTx(),
		)
	  )
	  err := d.driver.Table().Do(ctx,
		func(ctx context.Context, s table.Session) (err error) {
		  var (
			res   result.Result
			// id    uint64 // a variable for required results
			// title *string // a pointer for optional results
			// date  *time.Time // a pointer for optional results
		  )
		  _, res, err = s.Execute(
			ctx,
			readTx,
			parsedQuery.RawSql,
			table.NewQueryParameters(),
		  )
		  if err != nil {
			return err
		  }
		  defer res.Close() // result must be closed
		  log.DefaultLogger.Info("> select_simple_transaction:\n", res)
		  for res.NextResultSet(ctx) {

			for res.NextRow() {
			  // use ScanNamed to pass column names from the scan string,
			  // addresses (and data types) to be assigned the query results
			  var one int
       	 	err = res.Scan(&one)

			//   err = res.ScanNamed(
			// 	named.Optional("series_id", &id),
			// 	named.Optional("title", &title),
			// 	named.Optional("release_date", &date),
			//   )
			  if err != nil {
				return err
			  }
			  log.DefaultLogger.Info(
				"  > %d %s %s\n",
				one,
			  )
			}
		  }
		  return res.Err()
		},
	  )
	  if err != nil {
		// handle a query execution error
	  }

	// create data frame response.
	// For an overview on data frames and how grafana handles them:
	// https://grafana.com/docs/grafana/latest/developers/plugins/data-frames/

	// frame := data.NewFrame("response")

	// // add fields.
	// frame.Fields = append(frame.Fields,
	// 	data.NewField("time", nil, []time.Time{query.TimeRange.From, query.TimeRange.To}),
	// 	data.NewField("values", nil, []int64{10, 20}),
	// )

	// // add the frames to the response.
	// response.Frames = append(response.Frames, frame)

	return response
}

// CheckHealth handles health checks sent from Grafana to the plugin.
// The main use case for these health checks is the test button on the
// datasource configuration page which allows users to verify that
// a datasource is working as expected.
func (d *Datasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	// when logging at a non-Debug level, make sure you don't include sensitive information in the message
	// (like the *backend.QueryDataRequest)
	log.DefaultLogger.Info("CheckHealth called")

	ctxWithTimeout, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	err := d.CreateDatabaseConnection(ctxWithTimeout)

	var status = backend.HealthStatusOk
	var message = "Data source is working"

	if err != nil {
		log.DefaultLogger.Error("Checkhealth failed", err)
		status = backend.HealthStatusError
		message = fmt.Errorf("connection to data source failed. %w", err).Error()
	}

	// defer db.Close(ctx)

	return &backend.CheckHealthResult{
		Status:  status,
		Message: message,
	}, nil
}
