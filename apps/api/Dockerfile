FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --workspace @terrawatch/api --workspace @terrawatch/shared --ignore-scripts

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules 2>/dev/null || true
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/
COPY package.json ./

RUN mkdir -p /data
ENV DATA_DIR=/data
EXPOSE 3001

CMD ["node", "apps/api/src/index.js"]
