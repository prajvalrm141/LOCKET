# Multi-stage build for Locket: React frontend + Express backend
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY . .
RUN npm ci
RUN npm run db:generate
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Copy server entry point
COPY server.ts ./
COPY tsconfig.json ./

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

CMD ["node", "--loader", "tsx", "server.ts"]
