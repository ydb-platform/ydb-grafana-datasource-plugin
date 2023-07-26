import { InlineField, Input } from '@grafana/ui';
import { useDispatchEditorHeight, useEditorHeight } from 'containers/QueryEditor/EditorSettingsContext';

import { defaultLabelWidth, defaultNumberInputWidth } from 'containers/QueryEditor/constants';

import { selectors } from 'selectors';

export function SqlEditorHeightInput() {
  const height = useEditorHeight();
  const setEditorHeight = useDispatchEditorHeight();
  const { label, tooltip } = selectors.components.QueryBuilder.EditorHeight;

  return (
    <InlineField labelWidth={defaultLabelWidth} tooltip={tooltip} label={label}>
      <Input
        type="number"
        value={height}
        onChange={(e) => setEditorHeight(e.currentTarget.valueAsNumber)}
        width={defaultNumberInputWidth}
      />
    </InlineField>
  );
}
