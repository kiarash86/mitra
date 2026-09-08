FROM node:22-alpine AS frontend-builder

WORKDIR /app/web

COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web/ .

ARG VITE_ORG_SLUG
ENV VITE_ORG_SLUG=$VITE_ORG_SLUG

RUN npm run build

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

COPY --from=frontend-builder /app/web/dist ./web/dist

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/bin/mitra .

FROM alpine:3.20

RUN sed -i 's/https/http/' /etc/apk/repositories
RUN apk add --no-cache ca-certificates

WORKDIR /app
COPY --from=builder /app/bin/mitra .

EXPOSE 8080

ENTRYPOINT ["./mitra", "serve"]