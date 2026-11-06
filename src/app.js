// Express app. The repo (database layer) is passed in, so unit tests can use a fake one.
const path = require('path');
const express = require('express');
const client = require('prom-client');
const { validateTitle, parseId } = require('./validate');

function createApp({ repo, version = process.env.APP_VERSION || 'dev', env = process.env.APP_ENV || 'local' }) {
  const app = express();
  app.use(express.json());

  // Prometheus metrics: HTTP request latency + default Node.js process metrics.
  const register = new client.Registry();
  client.collectDefaultMetrics({ register });
  const httpDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request latency in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
    registers: [register],
  });

  app.use((req, res, next) => {
    const end = httpDuration.startTimer();
    res.on('finish', () => {
      const route = req.route ? req.route.path : req.path;
      end({ method: req.method, route, status: res.statusCode });
    });
    next();
  });

  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/health', async (req, res) => {
    try {
      await repo.ping();
      res.json({ status: 'OK', database: 'connected', version, env });
    } catch (err) {
      res.status(503).json({ status: 'ERROR', database: 'disconnected', version, env });
    }
  });

  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
  });

  app.get('/api/tasks', async (req, res, next) => {
    try {
      res.json(await repo.list());
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/tasks', async (req, res, next) => {
    const check = validateTitle(req.body && req.body.title);
    if (!check.ok) return res.status(400).json({ error: check.error });
    try {
      return res.status(201).json(await repo.add(check.value));
    } catch (err) {
      return next(err);
    }
  });

  app.patch('/api/tasks/:id/complete', async (req, res, next) => {
    const check = parseId(req.params.id);
    if (!check.ok) return res.status(400).json({ error: check.error });
    try {
      const task = await repo.complete(check.value);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      return res.json(task);
    } catch (err) {
      return next(err);
    }
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
