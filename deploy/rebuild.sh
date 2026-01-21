#!/bin/bash
set -e

echo "Pulling latest changes..."
git pull

echo "Stopping containers..."
docker-compose -f docker-compose.prod.yml down

echo "Removing old frontend volume..."
docker volume rm deploy_frontend_dist 2>/dev/null || true

echo "Rebuilding containers..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

echo "Done! Containers running:"
docker ps
