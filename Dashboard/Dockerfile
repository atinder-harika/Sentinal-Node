# Use Node 20 Alpine for a lightweight, fast build
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies. 
# We explicitly use npm install to bypass the strict pnpm frozen-lockfile error you were hitting.
RUN npm install

# Copy the rest of your Next.js project code
COPY . .

# Build the Next.js application for production
RUN npm run build

# Expose port 3000 (Railway will automatically map this)
EXPOSE 3000

# Start the Next.js production server
CMD ["npm", "start"]