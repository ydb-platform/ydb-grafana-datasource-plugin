package main

import (
	"encoding/json"
	"net/http"
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
	ds.CustomRoutes = map[string]func(http.ResponseWriter, *http.Request){
		"/listTables": func(w http.ResponseWriter, r *http.Request) {
			if err := func(w http.ResponseWriter) error {
				tablesString, err := plugin.RetrieveListTablesForRoot(settings)
				if err != nil {
					return err
				}
				_, err = w.Write(tablesString)
				if err != nil {
					return err
				}
				return nil
			}(w); err != nil {
				w.WriteHeader(500)
				jsonErr, _ := json.Marshal(err.Error())
				w.Write(jsonErr)
				log.DefaultLogger.Error(err.Error())
			}
		},
		"/listFields": func(w http.ResponseWriter, r *http.Request) {
			if err := func(w http.ResponseWriter) error {
				query := r.URL.Query()
				table := query.Get("table")
				fieldsString, err := plugin.RetrieveTableFields(settings, table)
				if err != nil {
					return err
				}
				_, err = w.Write(fieldsString)
				if err != nil {
					return err
				}
				return nil
   			}(w); err != nil {
				w.WriteHeader(500)
				jsonErr, _ := json.Marshal(err.Error())
				w.Write(jsonErr)
				log.DefaultLogger.Error(err.Error())
			}
		},
	}
	return ds.NewDatasource(settings)
}
