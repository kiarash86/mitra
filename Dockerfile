# --- build stage ---
FROM golang:1.27-alpine AS builder

WORKDIR /app

# cache deps separately from source
COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/bin/api ./cmd/api

# --- runtime stage ---
FROM alpine:3.20

RUN apk add --no-cache ca-certificates

WORKDIR /app
COPY --from=builder /app/bin/api .

EXPOSE 8080

ENTRYPOINT ["./api"]
