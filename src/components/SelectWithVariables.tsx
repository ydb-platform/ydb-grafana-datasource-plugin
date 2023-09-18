import { SelectableValue } from '@grafana/data';
import { Select } from '@grafana/ui';

import { defaultInputWidth } from 'containers/QueryEditor/constants';
import { useVariables } from 'containers/QueryEditor/helpers';

interface SelectWithVariablesProps {
  onChange: (value: string[]) => void;
  additionalOptions?: string[];
  value: string[];
  isMulti?: boolean;
  placeholder?: string;
  variablesOptions?: { usePanelVars?: boolean; format?: string; wrapper?: string };
}

export function SelectWithVariables({
  onChange,
  additionalOptions = [],
  value,
  isMulti,
  placeholder,
  variablesOptions = {},
}: SelectWithVariablesProps) {
  const variables = useVariables(variablesOptions);
  const getSelectableParams = () => {
    const allParams = Array.from(new Set([...variables, ...value, ...additionalOptions]));
    let selectableValues: Array<SelectableValue<string>> = allParams.map((value) => ({
      label: value,
      value: value,
    }));
    return selectableValues;
  };
  const handleChangeMultiParamsSelect = (e: Array<SelectableValue<string>>) => {
    onChange(e.map((el) => el.value ?? '').filter(Boolean));
  };
  const handleChangeSingleParamsSelect = (e: SelectableValue<string>) => {
    onChange(e?.value ? [e.value] : []);
  };
  if (isMulti) {
    return (
      <Select
        // bug in grafana types. isMulti option is not taken into account
        onChange={handleChangeMultiParamsSelect as any}
        options={getSelectableParams()}
        value={value}
        menuPlacement={'bottom'}
        isClearable
        allowCustomValue
        isMulti
        width={defaultInputWidth}
        placeholder={placeholder}
      />
    );
  }
  return (
    <Select
      onChange={handleChangeSingleParamsSelect}
      options={getSelectableParams()}
      value={value[0]}
      menuPlacement={'bottom'}
      isClearable
      allowCustomValue
      width={defaultInputWidth}
      placeholder={placeholder}
    />
  );
}
