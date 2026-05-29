## Production Dockerfile for apps/ws (Socket.IO server)
## Build context: repo root (.)

FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json ./
COPY apps/ws/package.json apps/ws/package.json
COPY packages/db/package.json packages/db/package.json

RUN npm ci --ignore-scripts

FROM base AS build
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run db:generate
RUN npm -w apps/ws run build

FROM base AS runner
RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
ENV WS_PORT=3001
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/ws/package.json ./apps/ws/package.json
COPY --from=build /app/apps/ws/src ./apps/ws/src
COPY --from=build /app/packages/db/package.json ./packages/db/package.json
COPY --from=build /app/packages/db/src ./packages/db/src
COPY --from=build /app/packages/db/generated ./packages/db/generated
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3001
CMD ["npx", "tsx", "apps/ws/src/index.ts"]
