package models

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

type AuthKind string

const defaultAuthKind AuthKind = `Anonymous`

// Settings - data loaded from grafana settings database
type Settings struct {
	AuthKind                AuthKind `json:"authKind"`
	DBEndpoint              string   `json:"endpoint,omitempty"`
	DBLocation              string   `json:"dbLocation,omitempty"`
	User                    string   `json:"user,omitempty"`
	Secrets          		*SecretPluginSettings `json:"-"`
	Dsn 					string
	IsSecureConnection		bool
}

type SecretPluginSettings struct {
	ServiceAccAuthAccessKey string
	AccessToken             string
	Password                string
	Certificate				string
}

type SettingsOptionFunc func(settings *Settings)

// LoadSettings will read and validate Settings from the DataSourceConfig
func LoadSettings(source backend.DataSourceInstanceSettings) (*Settings, error) {
	if source.JSONData == nil || len(source.JSONData) < 1 {
		// If no settings have been saved return default values
		return &Settings{
			AuthKind: defaultAuthKind,
			Secrets:  loadSecretPluginSettings(source.DecryptedSecureJSONData),
		}, nil
	}

	settings := Settings{
		AuthKind: defaultAuthKind,
	}

	err := json.Unmarshal(source.JSONData, &settings)

	if err != nil {
		return nil, fmt.Errorf("could not unmarshal PluginSettings json: %w", err)
	}
	settings.Secrets = loadSecretPluginSettings(source.DecryptedSecureJSONData)

	return validateSettings(settings)
}

func loadSecretPluginSettings(source map[string]string) *SecretPluginSettings {
	
	return &SecretPluginSettings{
		ServiceAccAuthAccessKey: source["serviceAccAuthAccessKey"],
		AccessToken: source["accessToken"],
		Password: source["password"],
		Certificate: source["certificate"],
	}
}

func validateSettings(settings Settings) (*Settings, error) {
	if settings.DBEndpoint == "" {
		return nil, fmt.Errorf("%w", ErrEndpointEmpty)
	}
	if settings.DBLocation == "" {
		return nil, fmt.Errorf("%w", ErrDBLocationEmpty)
	}

	switch settings.AuthKind {
	case "ServiceAccountKey":
		if  settings.Secrets.ServiceAccAuthAccessKey == "" {
			return nil, fmt.Errorf("%w", ErrServiceAccAuthAccessKeyEmpty)
		}
	case "AccessToken":
		if  settings.Secrets.AccessToken == "" {
			return nil, fmt.Errorf("%w", ErrAccessTokenEmpty)
		}
	case "UserPassword":
		if  settings.Secrets.Password == "" || settings.User == ""  {
			return nil, fmt.Errorf("%w", ErrUserOrPasswordEmpty)
		}
	}
	settings.Dsn = settings.DBEndpoint + settings.DBLocation
	settings.IsSecureConnection = strings.HasPrefix(settings.DBEndpoint, "grpcs://")
	return &settings, nil
}

// func loadSettingsForServiceAccAuthAccessKey(jsonData map[string]interface{}, config backend.DataSourceInstanceSettings) (settings *Settings, err error) {
// 	var endpoint, dbLocation interface{}

// 	if endpoint = jsonData["endpoint"]; endpoint == nil {
// 		err = fmt.Errorf("%w", ErrEndpointEmpty)
// 		return
// 	}

// 	if dbLocation = jsonData["dbLocation"]; dbLocation == nil {
// 		err = fmt.Errorf("%w", ErrDBLocationEmpty)
// 		return
// 	}

// 	serviceAccAuthAccessKey, ok := config.DecryptedSecureJSONData["tlsClientCert"]
// 	if !ok {
// 		err = fmt.Errorf("%w", ErrServiceAccAuthAccessKeyEmpty)
// 		return
// 	}

// 	return makeNewSettingsWhirOpts(defaultAuthKind, withDBEndpoint(endpoint.(string)),
// 		withDBLocation(dbLocation.(string)), withServiceAccAuthAccessKey(serviceAccAuthAccessKey)), err
// }

// // NewSettings .-
// func makeNewSettingsWhirOpts(authKind AuthKind, opts ...SettingsOptionFunc) *Settings {
// 	settings := &Settings{
// 		AuthKind: authKind,
// 	}
// 	for _, opt := range opts {
// 		opt(settings)
// 	}
// 	return settings
// }

// // WithDBEndpoint .-
// func withDBEndpoint(dbEndpoint string) SettingsOptionFunc {
// 	return func(s *Settings) {
// 		s.DBEndpoint = dbEndpoint
// 	}
// }

// // WithDBLocation .-
// func withDBLocation(dbLocation string) SettingsOptionFunc {
// 	return func(s *Settings) {
// 		s.DBLocation = dbLocation
// 	}
// }

// // WithServiceAccAuthAccessKey .-
// func withServiceAccAuthAccessKey(defaultAuthKind string) SettingsOptionFunc {
// 	return func(s *Settings) {
// 		s.ServiceAccAuthAccessKey = defaultAuthKind
// 	}
// }
