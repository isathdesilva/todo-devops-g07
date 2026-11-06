# To-Do List DevOps Pipeline (SWE40006, Group 7)

A containerised To-Do List web app with a multi-environment CI/CD pipeline.
Members: Isath De Silva, Syeda Maliha Tabassum, Shahbaz Taseen.

**Setup steps:** see [docs/SETUP-GUIDE.md](docs/SETUP-GUIDE.md).

## Pipeline

```
Developer (Docker) --git push--> GitHub --> CI/Build server (GitHub Actions runner)
   build image + unit tests (Jest, >=80% coverage)
        --> Test/Staging server (EC2): deploy, integration tests (Supertest + PostgreSQL), E2E (Playwright)
        --> manual approval
        --> Production server (EC2): deploy the SAME image, /health check
              + Prometheus, node-exporter, Grafana (CPU, RAM, disk, network, HTTP latency, 2 alerts)
```

## Project layout

| Path | What it is |
|---|---|
| `src/` | Express app (`app.js`), PostgreSQL layer (`db.js`), validation (`validate.js`) |
| `public/index.html` | Front end. The `<h1 id="heading">` is what we change in the demo |
| `tests/unit/` | Jest unit tests, no database |
| `tests/integration/` | Jest + Supertest against a real PostgreSQL |
| `e2e/` | Playwright browser tests |
| `Dockerfile` | `test` image (all tools) and `prod` image (small, runtime only) |
| `docker-compose.yml` | Local development environment |
| `deploy/docker-compose.yml` | Staging and production (app + PostgreSQL with a volume) |
| `monitoring/` | Prometheus, alert rules, Grafana dashboard |
| `.github/workflows/pipeline.yml` | The CI/CD pipeline |

## Run locally (development environment)

```bash
docker compose up --build
# open http://localhost:3000
```

## Run tests without Docker

```bash
npm install
npm run test:unit                       # unit tests + coverage
DB_HOST=localhost npm run test:integration   # needs a PostgreSQL (user/password/db: todo)
BASE_URL=http://localhost:3000 npm run test:e2e
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | To-Do page |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Add a task `{ "title": "..." }` |
| PATCH | `/api/tasks/:id/complete` | Mark a task complete |
| GET | `/health` | App + database status |
| GET | `/metrics` | Prometheus metrics |
