FROM node:22.14-slim AS builder

WORKDIR /app

# Copy everything
COPY . .

# Install root deps (@prisma/client needed for prisma generate)
RUN npm install

# Install client deps (with optional for Rolldown linux binding) and build
RUN cd client && npm install --include=optional --force && npm run build

# Install server deps
RUN cd server && npm install

# Generate Prisma client
RUN server/node_modules/.bin/prisma generate --schema=prisma/schema.prisma

# Production stage
FROM node:22.14-slim

WORKDIR /app

ENV NODE_ENV=production

# Copy built client and server
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000

CMD ["node", "server/index.js"]
