// Integration tests: real Express app + real PostgreSQL database.
// Needs DB_HOST / DB_USER / DB_PASSWORD / DB_NAME pointing at a TEST database.
const request = require('supertest');
const { createApp } = require('../../src/app');
const { createRepo } = require('../../src/db');

let repo;
let app;

beforeAll(async () => {
  repo = createRepo();
  await repo.init();
  app = createApp({ repo, version: 'integration', env: 'test' });
});

beforeEach(async () => {
  await repo.clear(); // clean test data every test
});

afterAll(async () => {
  await repo.clear();
  await repo.close();
});

test('health check confirms the database connection', async () => {
  const res = await request(app).get('/health');
  expect(res.status).toBe(200);
  expect(res.body.database).toBe('connected');
});

test('a task added through the API is saved in PostgreSQL', async () => {
  await request(app).post('/api/tasks').send({ title: 'Integration task' }).expect(201);
  const rows = await repo.list();
  expect(rows).toHaveLength(1);
  expect(rows[0].title).toBe('Integration task');
});

test('completing a task updates the database', async () => {
  const created = await request(app).post('/api/tasks').send({ title: 'Finish me' });
  await request(app).patch(`/api/tasks/${created.body.id}/complete`).expect(200);
  const rows = await repo.list();
  expect(rows[0].completed).toBe(true);
});

test('tasks persist across a new app instance (simulated restart)', async () => {
  await request(app).post('/api/tasks').send({ title: 'Survives restart' });
  const app2 = createApp({ repo, version: 'integration', env: 'test' });
  const res = await request(app2).get('/api/tasks');
  expect(res.body.map((t) => t.title)).toContain('Survives restart');
});
