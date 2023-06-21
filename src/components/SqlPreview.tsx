import { InlineField, Input } from '@grafana/ui';

import { defaultLabelWidth } from 'containers/QueryEditor/constants';

import { selectors } from 'selectors';

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
