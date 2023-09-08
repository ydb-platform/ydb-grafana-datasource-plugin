import { InlineField } from '@grafana/ui';

import { defaultLabelWidth } from 'containers/QueryEditor/constants';

import { selectors } from 'selectors';
import { styles } from 'styles';

interface SqlPreviewProps {
  rawSql?: string;
}
export function SqlPreview({ rawSql }: SqlPreviewProps) {
  const { label, tooltip } = selectors.components.QueryBuilder.SqlPreview;
  return (
    <InlineField labelWidth={defaultLabelWidth} tooltip={tooltip} label={label} shrink>
      <div className={styles.Common.rawSqlWrapper}>
        <span>{rawSql}</span>
      </div>
    </InlineField>
  );
}
