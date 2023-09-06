import { CancellationToken, Position, editor as monacoEditor, languages, IRange } from 'monaco-editor';
import { ParseResult, parseGenericSql } from 'sql-autocomplete-parsers';

import { DataSource } from 'datasource';
import { wrapString } from 'containers/QueryEditor/helpers';

const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

const KEEP_CACHE_MILLIS = 60 * 60 * 1000;

function getFieldsWithCache(datasource: DataSource) {
  const cache = new Map<string, string[]>();
  return async (value: string) => {
    const existed = cache.get(value);
    if (existed) {
      return existed;
    }
    const fields = await datasource.fetchFields(value);
    const fieldNames = fields.map((f) => f.name);
    cache.set(value, fieldNames);
    setTimeout(() => {
      cache.delete(value);
    }, KEEP_CACHE_MILLIS);
    return fieldNames;
  };
}

export function createProvideSuggestionsFunction(
  datasource: DataSource,
  tables: Array<{ label: string; value: string }>,
  variables: string[]
) {
  const getFields = getFieldsWithCache(datasource);
  return async (
    model: monacoEditor.ITextModel,
    cursorPosition: Position,
    _context: languages.CompletionContext,
    _token: CancellationToken
  ) => {
    const [queryBeforeCursor, queryAfterCursor] = getQueriesAroundCursor(model, cursorPosition);
    const parseResult = parseGenericSql(queryBeforeCursor, queryAfterCursor);
    const suggestions = await getSuggestions(model, cursorPosition, parseResult, tables, variables, getFields);

    return { suggestions };
  };
}

async function getSuggestions(
  model: monacoEditor.ITextModel,
  cursorPosition: Position,
  parseResult: ParseResult,
  tablesForSuggest: Array<{ label: string; value: string }>,
  variablesForSuggest: string[],
  getFields: (value: string) => Promise<string[]>
): Promise<languages.CompletionItem[]> {
  const rangeToInsertSuggestion = getRangeToInsertSuggestion(model, cursorPosition);

  if (shouldSuggestTables(parseResult)) {
    return tablesForSuggest.map(({ label, value }) => ({
      label,
      insertText: wrapString(value),
      kind: languages.CompletionItemKind.Value,
      detail: 'Table',
      range: rangeToInsertSuggestion,
    }));
  }

  const suggestions: languages.CompletionItem[] = [];

  parseResult.suggestColumnAliases?.forEach((columnAliasSuggestion) => {
    suggestions.push({
      label: columnAliasSuggestion.name,
      insertText: columnAliasSuggestion.name,
      kind: languages.CompletionItemKind.Interface,
      detail: 'Column alias',
      range: rangeToInsertSuggestion,
      sortText: suggestionIndexToWeight(0),
    });
  });

  if (parseResult.suggestColumns?.tables) {
    for (const table of parseResult.suggestColumns?.tables) {
      const tableIdentifier = table.identifierChain.map((identifier) => identifier.name).join('.');
      const fields = await getFields(tableIdentifier);
      fields.forEach((columnName) => {
        let columnNameSuggestion = wrapString(columnName);
        if (table.alias) {
          columnNameSuggestion = `${table.alias}.${wrapString(columnName)}`;
        }
        suggestions.push({
          label: columnName,
          insertText: columnNameSuggestion,
          kind: languages.CompletionItemKind.Field,
          detail: 'Column',
          range: rangeToInsertSuggestion,
          sortText: suggestionIndexToWeight(1),
        });
      });
    }
  }

  parseResult.suggestKeywords?.forEach((keywordSuggestion, index) => {
    suggestions.push({
      label: keywordSuggestion.value,
      insertText: keywordSuggestion.value,
      kind: languages.CompletionItemKind.Keyword,
      detail: 'Keyword',
      range: rangeToInsertSuggestion,
      sortText: suggestionIndexToWeight(index + 2),
    });
  });

  if (parseResult.suggestAggregateFunctions) {
    const aggregateFunctionsSortText = getLastSortText(suggestions);

    getAggregateFunctionNamesToSuggest().forEach((functionName) => {
      suggestions.push({
        label: functionName,
        insertText: getFunctionInsertTextWithCursor(functionName),
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: languages.CompletionItemKind.Function,
        detail: 'Aggregate function',
        range: rangeToInsertSuggestion,
        sortText: aggregateFunctionsSortText,
      });
    });
  }

  // @ts-ignore is not typed properly in sql-autocomplete-parsers
  if (parseResult.suggestValues) {
    variablesForSuggest?.forEach((variable) => {
      suggestions.push({
        label: variable,
        insertText: variable,
        kind: languages.CompletionItemKind.Variable,
        detail: 'Variable',
        range: rangeToInsertSuggestion,
      });
    });
  }

  if (parseResult.suggestFunctions) {
    const functionsSortText = getLastSortText(suggestions);

    getFunctionNamesToSuggest().forEach((functionName) => {
      suggestions.push({
        label: functionName,
        insertText: getFunctionInsertTextWithCursor(functionName),
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: languages.CompletionItemKind.Function,
        detail: 'Function',
        range: rangeToInsertSuggestion,
        sortText: functionsSortText,
      });
    });
  }

  return suggestions;
}

function getQueriesAroundCursor(model: monacoEditor.ITextModel, cursorPosition: Position): [string, string] {
  const queryBeforeCursor = model.getValueInRange({
    startColumn: 1,
    startLineNumber: 1,
    endColumn: cursorPosition.column,
    endLineNumber: cursorPosition.lineNumber,
  });

  const { endColumn: lastColumn, endLineNumber: lastLineEndLine } = model.getFullModelRange();
  const queryAfterCursor = model.getValueInRange({
    startColumn: cursorPosition.column,
    startLineNumber: cursorPosition.lineNumber,
    endColumn: lastColumn,
    endLineNumber: lastLineEndLine,
  });

  return [queryBeforeCursor, queryAfterCursor];
}

function shouldSuggestTables({ suggestTables }: ParseResult): boolean {
  if (typeof suggestTables !== 'object') {
    return false;
  }
  // This condition is strange, but only when parseResult.suggestTables === {} or {onlyTables: true},
  // it actually wants us to suggest tables;
  return suggestTables.onlyTables || Object.keys(suggestTables).length === 0;
}

function getRangeToInsertSuggestion(model: monacoEditor.ITextModel, cursorPosition: Position): IRange {
  const { startColumn: lastWordStartColumn, endColumn: lastWordEndColumn } = model.getWordUntilPosition(cursorPosition);
  // https://github.com/microsoft/monaco-editor/discussions/3639#discussioncomment-5190373 if user already typed "$" sign, it should not be duplicated
  const dollarBeforeLastWordStart =
    model.getLineContent(cursorPosition.lineNumber)[lastWordStartColumn - 2] === '$' ? 1 : 0;

  return {
    startColumn: lastWordStartColumn - dollarBeforeLastWordStart,
    startLineNumber: cursorPosition.lineNumber,
    endColumn: lastWordEndColumn,
    endLineNumber: cursorPosition.lineNumber,
  };
}

function suggestionIndexToWeight(index: number): string {
  const characterInsideAlphabet = alphabet[index];
  if (characterInsideAlphabet) {
    return characterInsideAlphabet;
  }

  const duplicateTimes = Math.floor(index / alphabet.length);
  const remains = index % alphabet.length;

  const lastCharacter = alphabet[alphabet.length - 1];
  if (lastCharacter === undefined) {
    console.error('[unexpected error]: unable to get last alphabet character');
    return '';
  }

  return lastCharacter.repeat(duplicateTimes) + alphabet[remains];
}

function getLastSortText(suggestions: languages.CompletionItem[]): string {
  // This char is like fallback value because
  // every item which have empty weight gets random position in suggestions list.
  let prefix = 'a';

  const lastSuggestion = suggestions[suggestions.length - 1];
  if (lastSuggestion !== undefined) {
    prefix = lastSuggestion.sortText + 'a';
  }

  return prefix;
}

function getAggregateFunctionNamesToSuggest(): string[] {
  return ['COUNT()', 'SUM()', 'AVG()', 'MIN()', 'MAX(), COUNT_IF(), SUM_IF(), AVG_IF(), SOME()'];
}

function getFunctionInsertTextWithCursor(functionTemplate: string): string {
  let normalizedFunctionTemplate = functionTemplate;
  if (functionTemplate.startsWith('$')) {
    normalizedFunctionTemplate = `\\${functionTemplate}`;
  }
  return `${normalizedFunctionTemplate.slice(0, -1)}$1)`;
}

function getFunctionNamesToSuggest(): string[] {
  return [
    '$__timeFilter()',
    '$__varFallback()',
    'LENGTH()',
    'SUBSTRING()',
    'FIND()',
    'RFIND()',
    'StartsWith()',
    'EndsWith()',
    'EndsWith()',
    'IF()',
    'NANVL()',
    'Random()',
    'RandomNumber()',
    'RandomUuid()',
    'MIN_OF()',
    'MIN_OF()',
    'COALESCE()',
    'String::Reverse()',
    'String::Substring()',
    'Math::Abs()',
    'Math::Pi()',
    'Math::Log()',
    'Math::Log10()',
    'Math::Floor()',
    'Math::Ceil()',
    'Math::Round()',
    'Math::Sqrt()',
    'Math::Sin()',
    'Math::Cos()',
  ];
}
