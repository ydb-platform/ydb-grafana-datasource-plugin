package plugin

import (
	"encoding/json"
	"fmt"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

type AuthType uint8

const (
	AuthTypeServiceAccAccessKey AuthType = iota
	AuthTypeCredentials
)

// Settings - data loaded from grafana settings database
type Settings struct {
	AuthKind                AuthType `json:"authKind"`
	DBEndpoint              string   `json:"endpoint,omitempty"`
	DBLocation              string   `json:"dbLocation,omitempty"`
	User                    string   `json:"user"`
	ServiceAccAuthAccessKey string
	AccessToken             string
	Password                string
}

type SettingsOptionFunc func(settings *Settings)

// LoadSettings will read and validate Settings from the DataSourceConfig
func LoadSettings(config backend.DataSourceInstanceSettings) (settings *Settings, err error) {
	var jsonData map[string]interface{}

	if err = json.Unmarshal(config.JSONData, &jsonData); err != nil {
		return settings, fmt.Errorf("%w: %s", ErrInvalidJSON, err)
	}

	if jsonData["authKind"] == nil {
		return settings, fmt.Errorf("%w", ErrAuthMethodEmpty)
	}
	authKind := jsonData["authKind"].(AuthType)

	if authKind == AuthTypeServiceAccAccessKey {
		settings, err = loadSettingsForServiceAccAuthAccessKey(jsonData, config)
	}

	return
}

func loadSettingsForServiceAccAuthAccessKey(jsonData map[string]interface{}, config backend.DataSourceInstanceSettings) (settings *Settings, err error) {
	var endpoint, dbLocation interface{}

	if endpoint = jsonData["endpoint"]; endpoint == nil {
		err = fmt.Errorf("%w", ErrEndpointEmpty)
		return
	}

	if dbLocation = jsonData["dbLocation"]; dbLocation == nil {
		err = fmt.Errorf("%w", ErrDBLocationEmpty)
		return
	}

	serviceAccAuthAccessKey, ok := config.DecryptedSecureJSONData["tlsClientCert"]
	if !ok {
		err = fmt.Errorf("%w", ErrServiceAccAuthAccessKeyEmpty)
		return
	}

	return makeNewSettingsWhirOpts(AuthTypeServiceAccAccessKey, withDBEndpoint(endpoint.(string)),
		withDBLocation(dbLocation.(string)), withServiceAccAuthAccessKey(serviceAccAuthAccessKey)), err
}

// NewSettings .-
func makeNewSettingsWhirOpts(authKind AuthType, opts ...SettingsOptionFunc) *Settings {
	settings := &Settings{
		AuthKind: authKind,
	}
	for _, opt := range opts {
		opt(settings)
	}
	return settings
}

// WithDBEndpoint .-
func withDBEndpoint(dbEndpoint string) SettingsOptionFunc {
	return func(s *Settings) {
		s.DBEndpoint = dbEndpoint
	}
}

// WithDBLocation .-
func withDBLocation(dbLocation string) SettingsOptionFunc {
	return func(s *Settings) {
		s.DBLocation = dbLocation
	}
}

// WithServiceAccAuthAccessKey .-
func withServiceAccAuthAccessKey(serviceAccAuthAccessKey string) SettingsOptionFunc {
	return func(s *Settings) {
		s.ServiceAccAuthAccessKey = serviceAccAuthAccessKey
	}
}
