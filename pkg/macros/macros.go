package macros

import (
	"errors"
	"fmt"

	"github.com/grafana/sqlds/v2"
)

var (
	ErrorNoArgumentsToMacro           = errors.New("expected minimum of 1 argument. But no argument found")
	ErrorInsufficientArgumentsToMacro = errors.New("expected number of arguments not matching")
)

type timeQueryType string

const (
	timeQueryTypeFrom timeQueryType = "from"
	timeQueryTypeTo   timeQueryType = "to"
)

func newTimeFilter(queryType timeQueryType, query *sqlds.Query) (string, error) {
	date := query.TimeRange.From
	if queryType == timeQueryTypeTo {
		date = query.TimeRange.To
	}
	micros := date.UTC().UnixMicro()
	return fmt.Sprintf("CAST(%d AS TIMESTAMP)", micros), nil
}

// FromTimestampFilter return time filter query based on grafana's timepicker's from time
func FromTimestampFilter(query *sqlds.Query, args []string) (string, error) {
	return newTimeFilter(timeQueryTypeFrom, query)
}

// ToTimestampFilter return time filter query based on grafana's timepicker's to time
func ToTimestampFilter(query *sqlds.Query, args []string) (string, error) {
	return newTimeFilter(timeQueryTypeTo, query)
}

func TimestampFilter(query *sqlds.Query, args []string) (string, error) {
	if len(args) != 1 {
		return "", fmt.Errorf("%w: expected 1 argument, received %d", sqlds.ErrorBadArgumentCount, len(args))
	}
	var (
		column = args[0]
		from   = query.TimeRange.From.UTC().UnixMicro()
		to     = query.TimeRange.To.UTC().UnixMicro()
	)
	return fmt.Sprintf("%s >= CAST(%d AS TIMESTAMP) AND %s <=  CAST(%d AS TIMESTAMP)", column, from, column, to), nil
}

