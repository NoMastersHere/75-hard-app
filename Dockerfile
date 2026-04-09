FROM node:22.14-slim AS builder

WORKDIR /app

# Copy everything
COPY . .

# Install client deps (with optional for Rolldown linux binding) and build
RUN cd client && npm install --include=optional --force && npm run build

# Install server deps
RUN cd server && npm install

# Install tsx globally for Prisma config loading fallback
RUN npm install -g tsx

# Generate Prisma client (use server's npx, schema at project root)
RUN server/node_modules/.bin/prisma generate --schema=prisma/schema.prisma

# Production stage
FROM node:22.14-slim

WORKDIR /app

# Copy built client and server
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.mjs ./prisma.config.mjs

EXPOSE 3000

CMD ["node", "server/index.js"]
