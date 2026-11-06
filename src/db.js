// PostgreSQL task repository. Covered by the integration tests.
const { Pool } = require('pg');

function createRepo(config = {}) {
  const pool = new Pool({
    host: config.host || process.env.DB_HOST || 'localhost',
    port: Number(config.port || process.env.DB_PORT || 5432),
    user: config.user || process.env.DB_USER || 'todo',
    password: config.password || process.env.DB_PASSWORD || 'todo',
    database: config.database || process.env.DB_NAME || 'todo',
  });

  return {
    async init() {
      // Retry so the app waits for the database container to be ready.
      for (let attempt = 1; attempt <= 10; attempt += 1) {
        try {
          await pool.query(`CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )`);
          return;
        } catch (err) {
          if (attempt === 10) throw err;
          console.log(`Database not ready (attempt ${attempt}/10), retrying in 3s...`);
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    },
    async list() {
      const { rows } = await pool.query('SELECT id, title, completed FROM tasks ORDER BY id');
      return rows;
    },
    async add(title) {
      const { rows } = await pool.query(
        'INSERT INTO tasks (title) VALUES ($1) RETURNING id, title, completed',
        [title]
      );
      return rows[0];
    },
    async complete(id) {
      const { rows } = await pool.query(
        'UPDATE tasks SET completed = TRUE WHERE id = $1 RETURNING id, title, completed',
        [id]
      );
      return rows[0] || null;
    },
    async ping() {
      await pool.query('SELECT 1');
      return true;
    },
    async clear() {
      await pool.query('TRUNCATE tasks RESTART IDENTITY');
    },
    async close() {
      await pool.end();
    },
  };
}

module.exports = { createRepo };
