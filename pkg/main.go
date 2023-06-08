package main

import (
	"os"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/sqlds/v2"

	"github.com/ydb/grafana-ydb-datasource/pkg/plugin"
)

func main() {
	if err := datasource.Manage("grafana-ydb-datasource", newDatasource, datasource.ManageOpts{}); err != nil {
		log.DefaultLogger.Error(err.Error())
		os.Exit(1)
	}
}

func newDatasource(settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	ds := sqlds.NewDatasource(&plugin.Ydb{})
	return ds.NewDatasource(settings)
}
