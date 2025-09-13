# Development Dockerfile for Go
FROM golang:1.22-alpine

WORKDIR /app

# Install git
RUN apk add --no-cache git

# Copy go.mod dan go.sum
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Run the application directly
CMD ["go", "run", "."]
