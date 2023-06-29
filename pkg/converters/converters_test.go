package converters_test

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	"github.com/ydb/grafana-ydb-datasource/pkg/converters"
)

func TestDate(t *testing.T) {
	layout := "2006-01-02"
	str := "2006-01-02"
	d, _ := time.Parse(layout, str)
	sut := converters.GetConverter("Date")
	v, err := sut.FrameConverter.ConverterFunc(&d)
	assert.Nil(t, err)
	actual := v.(time.Time)
	assert.Equal(t, d, actual)
}
