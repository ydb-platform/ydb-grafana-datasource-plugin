import * as React from 'react';
import { IDisposable, editor as monacoEditor } from 'monaco-editor';
import { CodeEditor, InlineField, monacoTypes } from '@grafana/ui';

import { OnChangeQueryAttribute, YDBSQLQuery } from './types';
import { MONACO_LANGUAGE_SQL } from './constants';
import { useEditorHeight } from './EditorSettingsContext';
import { useTables } from './TablesContext';
import { removeDatabaseFromTableName } from './helpers';
import { useDatabase, useDatasource } from './DatasourceContext';

import { createProvideSuggestionsFunction } from 'lib/sqlProvider';
import { highlightErrors, unHighlightErrors } from 'lib/highlightErrors';

let completionProvider: IDisposable | undefined;

interface SqlEditorProps {
  query: YDBSQLQuery;
  onChange: OnChangeQueryAttribute<YDBSQLQuery>;
}

export function SqlEditor({ onChange, query }: SqlEditorProps) {
  const datasource = useDatasource();
  const { tables } = useTables();
  const database = useDatabase();
  const editorHeight = useEditorHeight();
  const monacoRef = React.useRef<typeof monacoTypes | null>(null);
  const editorRef = React.useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
  const errorsHighlightingTimeoutIdRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const tablesForSuggest = React.useMemo(
    () => tables.map((t) => ({ label: removeDatabaseFromTableName(t, database), value: t })),
    [tables, database]
  );

  const registerCompletionProvider = React.useCallback(
    (monaco: typeof monacoTypes) => {
      if (completionProvider) {
        completionProvider.dispose();
      }
      completionProvider = monaco.languages.registerCompletionItemProvider(MONACO_LANGUAGE_SQL, {
        triggerCharacters: [' ', '\n', ''],
        provideCompletionItems: createProvideSuggestionsFunction(datasource, tablesForSuggest),
      });
    },
    [datasource, tablesForSuggest]
  );

  React.useEffect(() => {
    if (!monacoRef.current) {
      return;
    }
    registerCompletionProvider(monacoRef.current);
  }, [registerCompletionProvider]);
  const onQueryTextChange = (text: string) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    onChange({ rawSql: text });
    if (!editor || !monaco) {
      return;
    }
    unHighlightErrors(monaco.editor);
    if (errorsHighlightingTimeoutIdRef.current) {
      clearTimeout(errorsHighlightingTimeoutIdRef.current);
    }
    errorsHighlightingTimeoutIdRef.current = setTimeout(() => highlightErrors(editor, monaco), 500);
  };

  const handleMount = (editor: monacoEditor.IStandaloneCodeEditor, monaco: typeof monacoTypes) => {
    monacoRef.current = monaco;
    editorRef.current = editor;
    const editorModel = editor.getModel();
    editorModel?.onDidChangeContent(() => {
      onQueryTextChange(editor.getValue());
    });
  };

  const { rawSql } = query;
  return (
    <InlineField grow>
      <CodeEditor
        aria-label="SQL"
        height={editorHeight}
        language="sql"
        value={rawSql}
        showMiniMap={false}
        showLineNumbers={true}
        onEditorDidMount={handleMount}
        monacoOptions={{ wordWrap: 'on' }}
        onBeforeEditorMount={registerCompletionProvider}
      />
    </InlineField>
  );
}
