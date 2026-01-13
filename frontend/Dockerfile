# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=/api
ARG VITE_ADMIN_EMAIL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ADMIN_EMAIL=$VITE_ADMIN_EMAIL

RUN npm run build

# Production stage - just output the built files
FROM alpine:latest AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist

# This image is used to copy files to nginx, not run directly
CMD ["echo", "Frontend build complete"]
