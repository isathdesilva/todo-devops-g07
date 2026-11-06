// Unit tests for the API routes, using an in-memory fake repo (no database).
const request = require('supertest');
const { createApp } = require('../../src/app');

function fakeRepo() {
  let tasks = [];
  let nextId = 1;
  return {
    healthy: true,
    failNext: false,
    async ping() { if (!this.healthy) throw new Error('db down'); return true; },
    async list() { if (this.failNext) throw new Error('boom'); return tasks; },
    async add(title) { const t = { id: nextId++, title, completed: false }; tasks.push(t); return t; },
    async complete(id) { const t = tasks.find((x) => x.id === id); if (!t) return null; t.completed = true; return t; },
  };
}

describe('API routes', () => {
  let repo;
  let app;
  beforeEach(() => {
    repo = fakeRepo();
    app = createApp({ repo, version: 'test', env: 'unit' });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('GET /health returns OK when the database is up', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'OK', database: 'connected', version: 'test' });
  });

  test('GET /health returns 503 when the database is down', async () => {
    repo.healthy = false;
    const res = await request(app).get('/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('ERROR');
  });

  test('POST /api/tasks adds a task', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Write report' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, title: 'Write report', completed: false });
  });

  test('POST /api/tasks rejects an empty title', async () => {
    const res = await request(app).post('/api/tasks').send({ title: '' });
    expect(res.status).toBe(400);
  });

  test('GET /api/tasks lists tasks', async () => {
    await request(app).post('/api/tasks').send({ title: 'A' });
    const res = await request(app).get('/api/tasks');
    expect(res.body).toHaveLength(1);
  });

  test('PATCH complete marks a task done', async () => {
    await request(app).post('/api/tasks').send({ title: 'A' });
    const res = await request(app).patch('/api/tasks/1/complete');
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  test('PATCH complete returns 404 for a missing task', async () => {
    const res = await request(app).patch('/api/tasks/99/complete');
    expect(res.status).toBe(404);
  });

  test('PATCH complete returns 400 for a bad id', async () => {
    const res = await request(app).patch('/api/tasks/abc/complete');
    expect(res.status).toBe(400);
  });

  test('database errors return 500', async () => {
    repo.failNext = true;
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(500);
  });

  test('GET /metrics exposes Prometheus latency metrics', async () => {
    await request(app).get('/health');
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('http_request_duration_seconds');
  });

  test('GET / serves the To-Do page', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="heading"');
  });
});
