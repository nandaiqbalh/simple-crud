# Stage 1: Build
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Install git (needed for go mod download sometimes)
RUN apk add --no-cache git

# Copy go.mod and go.sum first, to leverage Docker cache
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build the Go application
RUN go build -o api .

# Stage 2: Run
FROM alpine:3.19

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/api .

# Expose the application port
EXPOSE 8000

# Run the application
CMD ["./api"]
