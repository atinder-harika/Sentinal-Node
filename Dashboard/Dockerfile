# Use Node 20 Alpine
FROM node:20-alpine

# INSTALL NATIVE BUILD TOOLS (Required for Snowflake SDK and other heavy packages)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Enable pnpm (since your local environment uses it)
RUN corepack enable pnpm

# Copy package.json and the pnpm lockfile (if it exists)
COPY package.json pnpm-lock.yaml* ./

# Install dependencies using pnpm, bypassing the strict frozen lockfile check
RUN pnpm install --no-frozen-lockfile

# Copy the rest of your Next.js project code
COPY . .

# Build the Next.js application
RUN pnpm run build

# Expose port 3000
EXPOSE 3000

# Start the Next.js production server
CMD ["pnpm", "start"]