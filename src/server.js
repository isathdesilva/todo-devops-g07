const { createApp } = require('./app');
const { createRepo } = require('./db');

const PORT = Number(process.env.PORT || 3000);

async function main() {
  const repo = createRepo();
  await repo.init();
  const app = createApp({ repo });
  app.listen(PORT, () => {
    console.log(`To-Do app (${process.env.APP_ENV || 'local'}) listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
