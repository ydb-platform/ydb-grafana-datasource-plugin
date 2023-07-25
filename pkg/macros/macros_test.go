package macros_test

import (
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/sqlds/v2"
	"github.com/stretchr/testify/assert"

	"github.com/ydb/grafana-ydb-datasource/pkg/macros"
	"github.com/ydb/grafana-ydb-datasource/pkg/plugin"
)

type YdbDriver struct {
	sqlds.Driver
}

type MockDB struct {
	YdbDriver
}

func (h *YdbDriver) Macros() sqlds.Macros {
	var C = plugin.Ydb{}
	return C.Macros()
}

func TestMacroFromTimestampFilter(t *testing.T) {
	from, _ := time.Parse("2006-01-02T15:04:05.000Z", "2021-11-12T11:45:26.371Z")
	to, _ := time.Parse("2006-01-02T15:04:05.000Z", "2022-11-12T11:45:26.371Z")
	query := sqlds.Query{
		TimeRange: backend.TimeRange{
			From: from,
			To:   to,
		},
		RawSQL: "select foo from foo where bar > $__fromTimestamp",
	}
	got, err := macros.FromTimestampFilter(&query, []string{})
	assert.Nil(t, err)
	assert.Equal(t, "CAST(1636717526371000 AS TIMESTAMP)", got)
}
func TestMacroToTimestampFilter(t *testing.T) {
	from, _ := time.Parse("2006-01-02T15:04:05.000Z", "2021-11-12T11:45:26.371Z")
	to, _ := time.Parse("2006-01-02T15:04:05.000Z", "2022-11-12T11:45:26.371Z")
	query := sqlds.Query{
		TimeRange: backend.TimeRange{
			From: from,
			To:   to,
		},
		RawSQL: "select foo from foo where bar > $__fromTimestamp",
	}
	got, err := macros.ToTimestampFilter(&query, []string{})
	assert.Nil(t, err)
	assert.Equal(t, "CAST(1668253526371000 AS TIMESTAMP)", got)
}

func TestMacroTimestampFilter(t *testing.T) {
	from, _ := time.Parse("2006-01-02T15:04:05.000Z", "2021-11-12T11:45:26.371Z")
	to, _ := time.Parse("2006-01-02T15:04:05.000Z", "2022-11-12T11:45:26.371Z")
	query := sqlds.Query{
		TimeRange: backend.TimeRange{
			From: from,
			To:   to,
		},
	}
	got, err := macros.TimestampFilter(&query, []string{"foo"})
	assert.Nil(t, err)
	assert.Equal(t, "foo >= CAST(1636717526371000 AS TIMESTAMP) AND foo <=  CAST(1668253526371000 AS TIMESTAMP)", got)
}

func TestMacroVariableFallback(t *testing.T) {
	query := sqlds.Query{
		RawSQL:   "select $__varFallback(fallback, value)",
	}
	got, err := macros.VariableFallback(&query, []string{"fallback", "value"})
	assert.Nil(t, err)
	assert.Equal(t, "value", got)
}
func TestMacroVariableFallbackNoValue(t *testing.T) {
	query := sqlds.Query{
		RawSQL:   "select $__varFallback(fallback, '')",
	}
	got, err := macros.VariableFallback(&query, []string{"fallback", ""})
	assert.Nil(t, err)
	assert.Equal(t, "fallback", got)
}
