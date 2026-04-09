FROM node:22.14-slim AS builder

WORKDIR /app

# Copy everything
COPY . .

# Install client deps (with optional for Rolldown linux binding) and build
RUN cd client && npm install --include=optional --force && npm run build

# Install server deps and generate Prisma client
RUN cd server && npm install && npx prisma generate --schema=../prisma/schema.prisma

# Production stage
FROM node:22.14-slim

WORKDIR /app

# Copy built client and server
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["node", "server/index.js"]
