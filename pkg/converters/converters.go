package converters

import (
	"fmt"
	"reflect"
	"regexp"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana-plugin-sdk-go/data/sqlutil"
	"github.com/shopspring/decimal"
)

var decimalMatch, _ = regexp.Compile(`^Decimal\(`)
var optionalDecimalMatch, _ = regexp.Compile(`^Optional<Decimal\(`)

type Converter struct {
	scanType   reflect.Type
	fieldType  data.FieldType
	matchRegex *regexp.Regexp
	convert    func(in interface{}) (interface{}, error)
}

var Converters = map[string]Converter{
	"Bool": {
		scanType:  reflect.PtrTo(reflect.TypeOf(true)),
		fieldType: data.FieldTypeBool,
	},
	"Double": {
		scanType:  reflect.PtrTo(reflect.TypeOf(float64(0))),
		fieldType: data.FieldTypeFloat64,
	},
	"Float": {
		scanType:  reflect.PtrTo(reflect.TypeOf(float32(0))),
		fieldType: data.FieldTypeFloat32,
	},
	"Int64": {
		scanType:  reflect.PtrTo(reflect.TypeOf(int64(0))),
		fieldType: data.FieldTypeInt64,
	},
	"Int32": {
		scanType:  reflect.PtrTo(reflect.TypeOf(int32(0))),
		fieldType: data.FieldTypeInt32,
	},
	"Int16": {
		scanType:  reflect.PtrTo(reflect.TypeOf(int16(0))),
		fieldType: data.FieldTypeInt16,
	},
	"Int8": {
		scanType:  reflect.PtrTo(reflect.TypeOf(int8(0))),
		fieldType: data.FieldTypeInt8,
	},
	"Uint64": {
		scanType:  reflect.PtrTo(reflect.TypeOf(uint64(0))),
		fieldType: data.FieldTypeUint64,
	},

	"Uint32": {
		scanType:  reflect.PtrTo(reflect.TypeOf(uint32(0))),
		fieldType: data.FieldTypeUint32,
	},
	"Uint16": {
		scanType:  reflect.PtrTo(reflect.TypeOf(uint16(0))),
		fieldType: data.FieldTypeUint16,
	},
	"Uint8": {
		scanType:  reflect.PtrTo(reflect.TypeOf(uint8(0))),
		fieldType: data.FieldTypeUint8,
	},
	"Decimal": {
		fieldType:  data.FieldTypeFloat64,
		scanType:   reflect.PtrTo(reflect.TypeOf(decimal.Decimal{})),
		convert:    decimalConvert,
		matchRegex: decimalMatch,
	},
	"Date": {
		fieldType:  data.FieldTypeTime,
		scanType:   reflect.PtrTo(reflect.TypeOf(time.Time{})),
	},
	"Datetime": {
		fieldType:  data.FieldTypeTime,
		scanType:   reflect.PtrTo(reflect.TypeOf(time.Time{})),
	},
	"Timestamp": {
		fieldType:  data.FieldTypeTime,
		scanType:   reflect.PtrTo(reflect.TypeOf(time.Time{})),
	},
	"Interval": {
		scanType:  reflect.PtrTo(reflect.TypeOf(int64(0))),
		fieldType: data.FieldTypeInt64,
		convert: intervalConvert,
	},
	"Optional<Interval>": {
		scanType:  reflect.PtrTo(reflect.PtrTo(reflect.TypeOf(int64(0)))),
		fieldType: data.FieldTypeNullableInt64,
		convert: intervalNullConvert,
	},
	"Optional<Bool>": {
		scanType:  reflect.PtrTo(reflect.PtrTo(reflect.TypeOf(true))),
		fieldType: data.FieldTypeNullableBool,
	},
	"Optional<Double>": {
		scanType:  reflect.PtrTo(reflect.PtrTo(reflect.TypeOf(float64(0)))),
		fieldType: data.FieldTypeNullableFloat64,
	},
	"Optional<Float>": {
		scanType:  reflect.PtrTo(reflect.PtrTo(reflect.TypeOf(float32(0)))),
		fieldType: data.FieldTypeNullableFloat32,
	},
	"Optional<Int64>": {
		scanType:  reflect.PtrTo(reflect.PtrTo(reflect.TypeOf(int64(0)))),
		fieldType: data.FieldTypeNullableInt64,
	},
	"Optional<Int32>": {
		scanType:  reflect.PtrTo(reflect.PtrTo(reflect.TypeOf(int32(0)))),
		fieldType: data.FieldTypeNullableInt32,
	},
	"Optional<Int16>": {
		scanType:  reflect.PtrTo(reflect.PtrTo(reflect.TypeOf(int16(0)))),
		fieldType: data.FieldTypeNullableInt16,
	},
	"Optional<Int8>": {
		scanType:  reflect.PtrTo(reflect.PtrTo(reflect.TypeOf(int8(0)))),
		fieldType: data.FieldTypeNullableInt8,
	},
	"Optional<Uint64>": {
		scanType:  reflect.PtrTo(reflect.PtrTo(reflect.TypeOf(uint64(0)))),
		fieldType: data.FieldTypeNullableUint64,
	},

	"Optional<Uint32>": {
		scanType:  reflect.PtrTo(reflect.PtrTo(reflect.TypeOf(uint32(0)))),
		fieldType: data.FieldTypeNullableUint32,
	},
	"Optional<Uint16>": {
		scanType:  reflect.PtrTo(reflect.PtrTo(reflect.TypeOf(uint16(0)))),
		fieldType: data.FieldTypeNullableUint16,
	},
	"Optional<Uint8>": {
		scanType:  reflect.PtrTo(reflect.PtrTo(reflect.TypeOf(uint8(0)))),
		fieldType: data.FieldTypeNullableUint8,
	},
	"Optional<Decimal>": {
		fieldType:  data.FieldTypeNullableFloat64,
		scanType:   reflect.PtrTo(reflect.PtrTo(reflect.TypeOf(decimal.Decimal{}))),
		convert:    decimalNullConvert,
		matchRegex: optionalDecimalMatch,
	},
	"Optional<Date>": {
		fieldType:  data.FieldTypeNullableTime,
		scanType:   reflect.PtrTo(reflect.PtrTo(reflect.TypeOf(time.Time{}))),
	},
	"Optional<Datetime>": {
		fieldType:  data.FieldTypeNullableTime,
		scanType:   reflect.PtrTo(reflect.PtrTo(reflect.TypeOf(time.Time{}))),
	},
	"Optional<Timestamp>": {
		fieldType:  data.FieldTypeNullableTime,
		scanType:   reflect.PtrTo(reflect.PtrTo(reflect.TypeOf(time.Time{}))),
	},
}

var ComplexTypes = []string{"Map"}
var YdbConverters = YDBConverters()

func YDBConverters() []sqlutil.Converter {
	var list []sqlutil.Converter
	for name, converter := range Converters {
		list = append(list, createConverter(name, converter))
	}
	return list
}

func GetConverter(columnType string) sqlutil.Converter {
	converter, ok := Converters[columnType]
	if ok {
		return createConverter(columnType, converter)
	}
	for name, converter := range Converters {
		if name == columnType {
			return createConverter(name, converter)
		}
		if converter.matchRegex != nil && converter.matchRegex.MatchString(columnType) {
			return createConverter(name, converter)
		}
	}
	return sqlutil.Converter{}
}

func createConverter(name string, converter Converter) sqlutil.Converter {
	convert := defaultConvert
	if converter.convert != nil {
		convert = converter.convert
	}
	return sqlutil.Converter{
		Name:           name,
		InputScanType:  converter.scanType,
		InputTypeRegex: converter.matchRegex,
		InputTypeName:  name,
		FrameConverter: sqlutil.FrameConverter{
			FieldType:     converter.fieldType,
			ConverterFunc: convert,
		},
	}
}

func intervalConvert(in interface{}) (interface{}, error) {
	if in == nil {
		return int64(0), nil
	}
	v, ok := in.(*int64)
	if !ok {
		return nil, fmt.Errorf("invalid interval - %v", in)
	}
	return *v / 1000, nil
}

func intervalNullConvert(in interface{}) (interface{}, error) {
	if in == nil {
		return int64(0), nil
	}
	v, ok := in.(**int64)
	if !ok {
		return nil, fmt.Errorf("invalid interval - %v", in)
	}
	if *v == nil {
		return (*int64)(nil), nil
	}
	t := **v / 1000
	return &t, nil
}

func defaultConvert(in interface{}) (interface{}, error) {
	if in == nil {
		return reflect.Zero(reflect.TypeOf(in)).Interface(), nil
	}
	return reflect.ValueOf(in).Elem().Interface(), nil
}

func decimalConvert(in interface{}) (interface{}, error) {
	if in == nil {
		return float64(0), nil
	}
	v, ok := in.(*decimal.Decimal)
	if !ok {
		return nil, fmt.Errorf("invalid decimal - %v", in)
	}
	f, _ := (*v).Float64()
	return f, nil
}

func decimalNullConvert(in interface{}) (interface{}, error) {
	if in == nil {
		return float64(0), nil
	}
	v, ok := in.(**decimal.Decimal)
	if !ok {
		return nil, fmt.Errorf("invalid decimal - %v", in)
	}
	if *v == nil {
		return (*float64)(nil), nil
	}
	f, _ := (*v).Float64()
	return &f, nil
}