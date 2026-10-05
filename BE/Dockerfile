FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json tsconfig*.json ./
RUN npm ci
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src ./src
COPY scripts ./scripts
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npx prisma generate
USER node
EXPOSE 8000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/server.js"]
