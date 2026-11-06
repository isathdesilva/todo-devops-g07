const { validateTitle, parseId, MAX_TITLE_LENGTH } = require('../../src/validate');

describe('validateTitle', () => {
  test('accepts a normal title and trims spaces', () => {
    expect(validateTitle('  Buy milk  ')).toEqual({ ok: true, value: 'Buy milk' });
  });
  test('rejects an empty title', () => {
    expect(validateTitle('   ').ok).toBe(false);
  });
  test('rejects a non-string title', () => {
    expect(validateTitle(42).ok).toBe(false);
    expect(validateTitle(undefined).ok).toBe(false);
  });
  test('rejects a title that is too long', () => {
    expect(validateTitle('a'.repeat(MAX_TITLE_LENGTH + 1)).ok).toBe(false);
  });
});

describe('parseId', () => {
  test('accepts a positive whole number', () => {
    expect(parseId('7')).toEqual({ ok: true, value: 7 });
  });
  test.each(['0', '-1', 'abc', '1.5'])('rejects %s', (raw) => {
    expect(parseId(raw).ok).toBe(false);
  });
});
