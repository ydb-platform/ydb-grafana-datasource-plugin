import { InlineField, Input } from '@grafana/ui';
import { selectors } from 'selectors';
import { defaultLabelWidth } from '../constants';

interface SqlPreviewProps {
  rawSql?: string;
}
export function SqlPreview({ rawSql }: SqlPreviewProps) {
  const { label, tooltip } = selectors.components.QueryBuilder.SqlPreview;
  return (
    <InlineField labelWidth={defaultLabelWidth} tooltip={tooltip} label={label} grow>
      <Input value={rawSql} disabled />
    </InlineField>
  );
}
