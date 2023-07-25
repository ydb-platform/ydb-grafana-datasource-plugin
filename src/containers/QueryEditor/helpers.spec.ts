import { escapeAndWrapString } from './helpers';

describe('should properly escapeAndWrapString', () => {
  it('simple string with backticks', () => {
    expect(escapeAndWrapString('foo')).toBe('`foo`');
  });
  it('simple string with double quotes', () => {
    expect(escapeAndWrapString('foo', '"')).toBe('"foo"');
  });
  it('string with forbidden symbols with backticks', () => {
    expect(escapeAndWrapString('fo\\o`"')).toBe('`fo\\\\o\\`"`');
  });
  it('string with forbidden symbols with double quotes', () => {
    expect(escapeAndWrapString('fo\\o`"', '"')).toBe('"fo\\\\o`\\""');
  });
});
