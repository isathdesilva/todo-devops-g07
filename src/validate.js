// Pure helpers. Easy to unit test with no database.

const MAX_TITLE_LENGTH = 200;

function validateTitle(title) {
  if (typeof title !== 'string') {
    return { ok: false, error: 'Title must be text' };
  }
  const clean = title.trim();
  if (clean.length === 0) {
    return { ok: false, error: 'Title cannot be empty' };
  }
  if (clean.length > MAX_TITLE_LENGTH) {
    return { ok: false, error: `Title must be ${MAX_TITLE_LENGTH} characters or less` };
  }
  return { ok: true, value: clean };
}

function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: 'Invalid task id' };
  }
  return { ok: true, value: id };
}

module.exports = { validateTitle, parseId, MAX_TITLE_LENGTH };
