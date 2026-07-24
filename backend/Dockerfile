FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN npm ci

# Copy the rest of the application
COPY . .

# Generate Prisma client using the latest schema.prisma
RUN npx prisma generate

EXPOSE 5000

# Start the application
CMD ["node", "index.js"]
