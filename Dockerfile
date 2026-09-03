# Portal image: dashboard plus every use-case UI.
# Use-case backends have their own Dockerfile under use-cases/<slug>/api/.

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# The dashboard reads these at request time, so they must exist in the image
# even though the application code is already bundled.
COPY --from=builder /app/shared-resources ./shared-resources
COPY --from=builder /app/use-cases ./use-cases

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
