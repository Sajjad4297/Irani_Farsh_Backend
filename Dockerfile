# ------------------------------------------------------------------------------
# Stage 1: Build stage
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install native dependencies required for compiling native addons (bcrypt)
RUN apk add --no-cache python3 make g++

# Install pnpm
RUN npm install -g pnpm

# Copy dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# Install all dependencies (including devDependencies for compiling)
RUN pnpm install --frozen-lockfile

# Copy compiler config and source code
COPY tsconfig*.json nest-cli.json ./
COPY src/ ./src/

# Compile application
RUN pnpm run build

# Remove development dependencies for production runtime
RUN pnpm prune --prod

# ------------------------------------------------------------------------------
# Stage 2: Production runtime stage
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Pre-create upload subdirectories and logs with proper ownership
RUN mkdir -p /app/uploads/category /app/uploads/product /app/uploads/user /app/logs \
    && chown -R node:node /app

# Copy production node_modules and built code from builder
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/package.json ./package.json

USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]
