## Production Dockerfile for apps/web (Next.js)
## Build context: repo root (.)

FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
# Native deps for Prisma / node-gyp if needed
RUN apk add --no-cache libc6-compat openssl

# Copy workspace manifests first for better caching
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json

# Install all deps (workspaces)
RUN npm ci --ignore-scripts

FROM base AS build
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (root script)
RUN npm run db:generate

# Build only the web workspace
RUN npm -w apps/web run build

FROM base AS runner
RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "-w", "apps/web", "run", "start"]

