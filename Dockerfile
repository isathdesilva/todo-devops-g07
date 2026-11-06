# ---------- test image: app + all dev tools (Jest, Supertest, Playwright + browsers) ----------
# Used in CI for unit tests and on the Test/Staging server for integration + E2E tests.
FROM mcr.microsoft.com/playwright:v1.48.2-jammy AS test
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "test"]

# ---------- production image: small, runtime dependencies only ----------
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY src ./src
COPY public ./public
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "src/server.js"]
