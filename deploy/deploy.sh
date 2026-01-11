#!/bin/bash
# Deployment script for One Word Story

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Deploying One Word Story"
echo "=========================================="

# Check for .env file
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please copy .env.example to .env and configure it."
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Validate required variables
if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "Error: POSTGRES_PASSWORD is required in .env"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "Error: JWT_SECRET is required in .env"
    exit 1
fi

# Create required directories
mkdir -p nginx/conf.d
mkdir -p certbot/conf
mkdir -p certbot/www

# Use docker compose (v2) or docker-compose (v1)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo "Using: $COMPOSE_CMD"

# Pull latest images and rebuild
echo "Building and starting containers..."
$COMPOSE_CMD -f docker-compose.prod.yml build --no-cache
$COMPOSE_CMD -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "Waiting for services to start..."
sleep 10

# Check service status
echo ""
echo "Service Status:"
$COMPOSE_CMD -f docker-compose.prod.yml ps

echo ""
echo "=========================================="
echo "Deployment complete!"
echo "=========================================="
echo ""
echo "Your app should be available at:"
echo "  http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_EC2_IP')"
echo ""
echo "To view logs:"
echo "  $COMPOSE_CMD -f docker-compose.prod.yml logs -f"
echo ""
echo "To stop:"
echo "  $COMPOSE_CMD -f docker-compose.prod.yml down"
echo ""
