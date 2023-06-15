import { Position, editor as monacoEditor, languages } from 'monaco-editor';

interface Lang {
  id: string;
}

interface Model {
  getValueInRange: Function;
  getWordUntilPosition: Function;
  getValue: Function;
}

export interface Range {
  startLineNumber: number;
  endLineNumber: number;
  startColumn: number;
  endColumn: number;
}

export interface SuggestionResponse {
  suggestions: Suggestion[];
}

export interface Suggestion {
  label: string;
  kind: number;
  documentation: string;
  insertText: string;
  range: Range;
  detail?: string;
}

export type Fetcher = {
  (text: string, range: Range): Promise<SuggestionResponse>;
};

export type YdbMonacoEditor = monacoEditor.IStandaloneCodeEditor;

export function registerSQL(lang: string, editor: YdbMonacoEditor, fetchSuggestions: Fetcher) {
  const registeredLang = languages.getLanguages().find((l: Lang) => l.id === lang);
  if (registeredLang !== undefined) {
    return editor;
  }

  languages.register({ id: lang });

  // just extend sql for now so we get syntax highlighting
  languages.registerCompletionItemProvider('sql', {
    triggerCharacters: [' ', '$', '.', ','],
    provideCompletionItems: async (model: Model, position: Position) => {
      const word = model.getWordUntilPosition(position);
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const range: Range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      return fetchSuggestions(textUntilPosition, range);
    },
  });

  return editor;
}

export const fetchSuggestions: Fetcher = async () => {
  return Promise.resolve({ suggestions: [] });
};
