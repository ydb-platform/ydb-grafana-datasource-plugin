import { MarkerSeverity, editor as monacoEditor } from 'monaco-editor';
import { monacoTypes } from '@grafana/ui';
import { SyntaxError, cursorSymbol, parseGenericSql } from 'sql-autocomplete-parsers';

// If our finished query is "SELECT * FROM|" and we try to parse it, parser thinks that we still haven't finished writing it and doesn't show some errors.
// In order to truly complete a finished query, we need to add space to it like so "SELECT * FROM |".
export function prepareFinishedQueryForParsing(query: string): string {
  return query + ' ';
}

// Parser location index starts with 1, not with 0
export function parserErrorLocationIndexToMonacoIndex(parserLocationIndex: number): number {
  return parserLocationIndex + 1;
}

const owner = 'ydbtech';

export function highlightErrors(editor: monacoEditor.IStandaloneCodeEditor, monaco: typeof monacoTypes): void {
  const model = editor.getModel();
  if (!model) {
    console.error('unable to retrieve model when highlighting errors');
    return;
  }
  const monacoEditor = monaco.editor;

  const parseResult = parseGenericSql(prepareFinishedQueryForParsing(model.getValue()), '');

  if (!parseResult.errors) {
    unHighlightErrors(monacoEditor);
    return;
  }

  const markers = parseResult.errors.map(
    (error): monacoEditor.IMarkerData => ({
      message: 'Syntax error',
      source: getErrorDescription(error),
      severity: MarkerSeverity.Error,
      startLineNumber: error.loc.first_line,
      startColumn: parserErrorLocationIndexToMonacoIndex(error.loc.first_column),
      endLineNumber: error.loc.last_line,
      endColumn: parserErrorLocationIndexToMonacoIndex(error.loc.last_column),
    })
  );
  monacoEditor.setModelMarkers(model, owner, markers);
}

export function unHighlightErrors(editor: typeof monacoEditor): void {
  editor.removeAllMarkers(owner);
}

function getErrorDescription(error: SyntaxError): string {
  if (!error.expected) {
    return '';
  }

  let description = `Expected one of [${error.expected.join(', ')}]`;

  if (error.text !== cursorSymbol) {
    description += `, but found '${error.text}'`;
  }

  return description;
}
