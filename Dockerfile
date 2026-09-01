# --- build stage ---
FROM golang:1.27-alpine AS builder

WORKDIR /app


ARG GOPROXY=https://goproxy.io,direct
ENV GOPROXY=${GOPROXY}
ENV GOSUMDB=off


ARG HTTP_PROXY
ARG HTTPS_PROXY
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}


RUN sed -i 's/https/http/' /etc/apk/repositories

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/bin/api ./cmd/api

FROM alpine:3.20

RUN sed -i 's/https/http/' /etc/apk/repositories
RUN apk add --no-cache ca-certificates

WORKDIR /app
COPY --from=builder /app/bin/api .

EXPOSE 8080

ENTRYPOINT ["./api"]