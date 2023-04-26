package plugin

import "errors"

var (
	ErrInvalidJSON                               = errors.New("could not parse json")
	ErrAuthMethodEmpty                           = errors.New("authentification method could not be empty")
	ErrEndpointEmpty                             = errors.New("endpoint could not be empty")
	ErrServiceAccAuthAccessKeyEmpty              = errors.New("service account auth access key could not be empty")
	ErrDBLocationEmpty                           = errors.New("data base location could not be empty")
	ErrLoadingSettingsForServiceAccAuthAccessKey = errors.New("error loading settings for service account auth access key")
)
