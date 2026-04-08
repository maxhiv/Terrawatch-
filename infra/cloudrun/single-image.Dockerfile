FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --ignore-scripts
COPY packages/shared/ packages/shared/
COPY apps/web/ apps/web/
COPY apps/api/ apps/api/
RUN npm --workspace @terrawatch/web run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/packages/shared/ packages/shared/
COPY --from=build /app/apps/api/ apps/api/
COPY --from=build /app/dist dist/
COPY package.json ./

RUN mkdir -p /data
ENV DATA_DIR=/data
ENV PORT=8080
EXPOSE 8080

CMD ["node", "apps/api/src/index.js"]
