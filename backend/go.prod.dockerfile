# Production Dockerfile for Go
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Install git
RUN apk add --no-cache git

# Copy go.mod and go.sum
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN go build -o api .

# Production stage
FROM alpine:3.19

WORKDIR /app

# Copy binary
COPY --from=builder /app/api .

# Expose port
EXPOSE 8000

# Run the application
CMD ["./api"]
