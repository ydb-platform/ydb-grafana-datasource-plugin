import { InlineField } from '@grafana/ui';
import { selectors } from 'selectors';
import { LIMIT, defaultLabelWidth } from 'containers/QueryEditor/constants';
import { SelectWithVariables } from './SelectWithVariables';

interface LimitProps {
  limit?: string;
  onChange: (limit: string) => void;
}
export function Limit({ limit = '', onChange }: LimitProps) {
  const { label, tooltip } = selectors.components.QueryBuilder.Limit;
  const handleLimitChange = (value: string[]) => {
    onChange(value[0]);
  };
  return (
    <InlineField labelWidth={defaultLabelWidth} tooltip={tooltip} label={label}>
      <SelectWithVariables value={[limit]} onChange={handleLimitChange} additionalOptions={[LIMIT]} />
    </InlineField>
  );
}
