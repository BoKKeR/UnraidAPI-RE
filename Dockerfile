FROM node:16-bullseye-slim AS builder

ENV NODE_ENV=production
ENV HOST 0.0.0.0
ENV PORT 80
ENV NODE_OPTIONS="--max_old_space_size=4096"
WORKDIR /app
COPY . ./

RUN npm install --omit=dev --legacy-peer-deps && npm run build

# Run appliaction
FROM node:16-bullseye-slim
ENV NODE_ENV=production
ENV NUXT_PORT=3005
WORKDIR /app

COPY --from=builder /app/.nuxt ./.nuxt
COPY --from=builder /app/node_modules ./node_modules

CMD ["./node_modules/.bin/nuxt", "start"]
