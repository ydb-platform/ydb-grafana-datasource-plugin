import { InlineField, Input } from '@grafana/ui';

import { defaultLabelWidth, defaultNumberInputWidth } from 'containers/QueryEditor/constants';

import { selectors } from 'selectors';

interface SqlEditorHeightInputProps {
  height: number;
  onChange: (height: number) => void;
}

export function SqlEditorHeightInput({ height, onChange }: SqlEditorHeightInputProps) {
  const { label, tooltip } = selectors.components.QueryBuilder.EditorHeight;

  return (
    <InlineField labelWidth={defaultLabelWidth} tooltip={tooltip} label={label}>
      <Input
        type="number"
        value={height}
        onChange={(e) => onChange(e.currentTarget.valueAsNumber)}
        width={defaultNumberInputWidth}
      />
    </InlineField>
  );
}
