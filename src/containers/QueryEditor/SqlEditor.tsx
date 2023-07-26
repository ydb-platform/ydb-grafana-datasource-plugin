import { CodeEditor, InlineField } from '@grafana/ui';

import { OnChangeQueryAttribute, YDBSQLQuery } from './types';
import { MONACO_LANGUAGE_SQL } from './constants';
import { YdbMonacoEditor, fetchSuggestions, registerSQL } from 'lib/sqlProvider';
import { useEditorHeight } from './EditorSettingsContext';

interface SqlEditorProps {
  query: YDBSQLQuery;
  onChange: OnChangeQueryAttribute<YDBSQLQuery>;
}

export function SqlEditor({ onChange, query }: SqlEditorProps) {
  const editorHeight = useEditorHeight();
  const onQueryTextChange = (text: string) => {
    onChange({ rawSql: text });
  };

  const { rawSql } = query;

  const handleMount = (editor: YdbMonacoEditor) => {
    registerSQL(MONACO_LANGUAGE_SQL, editor, fetchSuggestions);
  };

  return (
    <InlineField grow>
      <CodeEditor
        aria-label="SQL"
        height={editorHeight}
        language="sql"
        value={rawSql}
        onSave={onQueryTextChange}
        showMiniMap={false}
        showLineNumbers={true}
        onBlur={onQueryTextChange}
        onEditorDidMount={handleMount}
        monacoOptions={{ wordWrap: 'on' }}
      />
    </InlineField>
  );
}
