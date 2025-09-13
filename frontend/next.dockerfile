# Development Dockerfile for Next.js
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build for development (to generate CSS)
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment for development
ENV NODE_ENV=development

# Run development server with host binding
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
