#!/bin/bash
# EC2 Setup Script for One Word Story
# Run this on a fresh Amazon Linux 2023 or Ubuntu 22.04 EC2 instance

set -e

echo "=========================================="
echo "One Word Story - EC2 Setup Script"
echo "=========================================="

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "Cannot detect OS"
    exit 1
fi

echo "Detected OS: $OS"

# Update system
echo "Updating system packages..."
if [ "$OS" = "amzn" ]; then
    sudo yum update -y
elif [ "$OS" = "ubuntu" ]; then
    sudo apt-get update && sudo apt-get upgrade -y
fi

# Install Docker
echo "Installing Docker..."
if [ "$OS" = "amzn" ]; then
    sudo yum install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
elif [ "$OS" = "ubuntu" ]; then
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose (if not included)
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install Git
echo "Installing Git..."
if [ "$OS" = "amzn" ]; then
    sudo yum install -y git
elif [ "$OS" = "ubuntu" ]; then
    sudo apt-get install -y git
fi

# Create app directory
APP_DIR=/opt/one-word-story
echo "Creating app directory at $APP_DIR..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

echo ""
echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Log out and back in (for docker group to take effect)"
echo "   Or run: newgrp docker"
echo ""
echo "2. Clone your repository:"
echo "   cd $APP_DIR"
echo "   git clone https://github.com/YOUR_USERNAME/one-word-story.git ."
echo ""
echo "3. Create environment file:"
echo "   cp deploy/.env.example deploy/.env"
echo "   nano deploy/.env  # Edit with your values"
echo ""
echo "4. Deploy the application:"
echo "   cd deploy"
echo "   ./deploy.sh"
echo ""
echo "5. (Optional) Set up SSL with Let's Encrypt:"
echo "   ./setup-ssl.sh your-domain.com"
echo ""
