import * as React from 'react';
import { CodeEditor, InlineField } from '@grafana/ui';

import { SqlEditorHeightInput } from 'components/SqlEditorHeightInput';

import { OnChangeQueryAttribute, YDBSQLQuery } from './types';
import { MONACO_LANGUAGE_SQL, defaultSqlEditorHeight } from './constants';
import { YdbMonacoEditor, fetchSuggestions, registerSQL } from 'lib/sqlProvider';
import { useStateWithLocalStorage } from './helpers';

const SQL_EDITOR_HEIGHT_LS_KEY = 'SQL_EDITOR_HEIGHT_LS_KEY';

interface SqlEditorProps {
  query: YDBSQLQuery;
  onChange: OnChangeQueryAttribute<YDBSQLQuery>;
}

export function SqlEditor({ onChange, query }: SqlEditorProps) {
  const [editorHeight, setEditorHeight] = useStateWithLocalStorage<number>(
    SQL_EDITOR_HEIGHT_LS_KEY,
    defaultSqlEditorHeight
  );
  const onQueryTextChange = (text: string) => {
    onChange({ rawSql: text });
  };

  const { rawSql } = query;

  const handleMount = (editor: YdbMonacoEditor) => {
    registerSQL(MONACO_LANGUAGE_SQL, editor, fetchSuggestions);
  };

  return (
    <React.Fragment>
      <SqlEditorHeightInput height={editorHeight} onChange={setEditorHeight} />
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
    </React.Fragment>
  );
}
