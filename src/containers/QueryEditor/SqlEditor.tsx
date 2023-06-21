import { CodeEditor } from '@grafana/ui';

import { OnChangeQueryAttribute, YDBSQLQuery } from './types';
import { MONACO_LANGUAGE_SQL, defaultSqlEditorHeight } from './constants';
import { YdbMonacoEditor, fetchSuggestions, registerSQL } from 'lib/sqlProvider';

interface SqlEditorProps {
  query: YDBSQLQuery;
  onChange: OnChangeQueryAttribute<YDBSQLQuery>;
}

export function SqlEditor({ onChange, query }: SqlEditorProps) {
  const onQueryTextChange = (text: string) => {
    onChange({ rawSql: text });
  };

  const { rawSql } = query;

  const handleMount = (editor: YdbMonacoEditor) => {
    registerSQL(MONACO_LANGUAGE_SQL, editor, fetchSuggestions);
  };

  return (
    <CodeEditor
      aria-label="SQL"
      height={defaultSqlEditorHeight}
      language="sql"
      value={rawSql}
      onSave={onQueryTextChange}
      showMiniMap={false}
      showLineNumbers={true}
      onBlur={onQueryTextChange}
      onEditorDidMount={handleMount}
    />
  );
}
