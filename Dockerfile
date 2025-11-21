# Use Node.js 20.19 (required for Prisma 7)
FROM node:20.19-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy rest of the application
COPY . .

# Expose the port
EXPOSE 3001

# Start the Socket.io server
CMD ["npm", "run", "start:socket"]
