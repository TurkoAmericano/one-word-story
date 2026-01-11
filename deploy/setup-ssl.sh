#!/bin/bash
# SSL Setup Script using Let's Encrypt

set -e

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "Usage: ./setup-ssl.sh your-domain.com"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Use docker compose (v2) or docker-compose (v1)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo "=========================================="
echo "Setting up SSL for: $DOMAIN"
echo "=========================================="

# Create directories
mkdir -p certbot/conf
mkdir -p certbot/www

# Stop existing containers
$COMPOSE_CMD -f docker-compose.prod.yml down

# Start nginx for ACME challenge
$COMPOSE_CMD -f docker-compose.prod.yml up -d nginx

echo "Waiting for nginx to start..."
sleep 5

# Get certificate
echo "Requesting certificate from Let's Encrypt..."
docker run --rm \
    -v "$SCRIPT_DIR/certbot/conf:/etc/letsencrypt" \
    -v "$SCRIPT_DIR/certbot/www:/var/www/certbot" \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@$DOMAIN \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Update nginx config for SSL
echo "Updating nginx configuration for SSL..."
cat > nginx/conf.d/default.conf << EOF
# Rate limiting
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;

# Upstream for backend
upstream backend {
    server backend:3000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=63072000" always;

    # Frontend static files
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files \$uri \$uri/ /index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Restart all services
echo "Restarting services with SSL..."
$COMPOSE_CMD -f docker-compose.prod.yml down
$COMPOSE_CMD -f docker-compose.prod.yml up -d

echo ""
echo "=========================================="
echo "SSL setup complete!"
echo "=========================================="
echo ""
echo "Your app is now available at:"
echo "  https://$DOMAIN"
echo ""
echo "Certificate will auto-renew via certbot container."
echo ""
