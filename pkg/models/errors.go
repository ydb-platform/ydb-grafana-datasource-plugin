package models

import "errors"

var (
	ErrInvalidJSON                               = errors.New("could not parse json")
	ErrEndpointEmpty                             = errors.New("endpoint should not be empty")
	ErrServiceAccAuthAccessKeyEmpty              = errors.New("service account auth access key should not be empty")
	ErrAccessTokenEmpty                          = errors.New("access token should not be empty")
	ErrUserOrPasswordEmpty                       = errors.New("username and password should not be empty")
	ErrDBLocationEmpty                           = errors.New("data base location should not be empty")
	ErrLoadingSettingsForServiceAccAuthAccessKey = errors.New("error loading settings for service account auth access key")
)
