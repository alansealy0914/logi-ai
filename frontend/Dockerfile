FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Copy source
COPY . .

# Build for production (optional but recommended)
RUN npm run build

# Production stage (lighter)
FROM node:20-alpine

WORKDIR /app

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Install only production dependencies
RUN npm ci --production --frozen-lockfile

EXPOSE 3000

# For Vite dev server (since you're using npm run dev)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]