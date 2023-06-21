import { InlineField, Input } from '@grafana/ui';
import { selectors } from 'selectors';
import { defaultLabelWidth, defaultNumberInputWidth } from 'containers/QueryEditor/constants';

interface LimitProps {
  limit?: number;
  onChange: (limit: number) => void;
}
export function Limit({ limit, onChange }: LimitProps) {
  const { label, tooltip } = selectors.components.QueryBuilder.Limit;
  return (
    <InlineField labelWidth={defaultLabelWidth} tooltip={tooltip} label={label}>
      <Input
        width={defaultNumberInputWidth}
        value={limit}
        type="number"
        min={1}
        onChange={(e) => onChange(e.currentTarget.valueAsNumber)}
      />
    </InlineField>
  );
}
