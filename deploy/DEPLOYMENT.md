# AWS EC2 Deployment Guide (Free Tier)

This guide walks you through deploying One Word Story to AWS EC2 using the free tier.

## Prerequisites

- AWS Account
- Domain name (optional, but recommended for SSL)

## Step 1: Create EC2 Instance

1. Log into [AWS Console](https://console.aws.amazon.com/)
2. Go to **EC2** → **Launch Instance**
3. Configure:
   - **Name**: `one-word-story`
   - **AMI**: Amazon Linux 2023 or Ubuntu 22.04 LTS (both free tier eligible)
   - **Instance type**: `t2.micro` (free tier)
   - **Key pair**: Create new or select existing (you'll need this to SSH)
   - **Network settings**:
     - Allow SSH (port 22) from your IP
     - Allow HTTP (port 80) from anywhere
     - Allow HTTPS (port 443) from anywhere
   - **Storage**: 8 GB gp3 (free tier allows up to 30 GB)
4. Click **Launch Instance**

## Step 2: Connect to EC2

```bash
# Make your key file secure
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
# For Ubuntu, use: ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

## Step 3: Run Setup Script

```bash
# Download and run the setup script
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/one-word-story/master/deploy/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh

# Apply docker group (or log out and back in)
newgrp docker
```

## Step 4: Clone and Configure

```bash
cd /opt/one-word-story

# Clone your repository
git clone https://github.com/YOUR_USERNAME/one-word-story.git .

# Create environment file
cp deploy/.env.example deploy/.env

# Edit with your values
nano deploy/.env
```

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | Strong database password |
| `JWT_SECRET` | Random secret for JWT tokens (use `openssl rand -base64 32`) |
| `FRONTEND_URL` | Your domain or `http://YOUR_EC2_IP` |

### Optional Email Configuration

For email verification to work, configure SMTP. Options:
- **AWS SES** (free tier: 62,000 emails/month from EC2)
- **Gmail** (limited, requires app password)
- **SendGrid/Mailgun** (have free tiers)

## Step 5: Deploy

```bash
cd /opt/one-word-story/deploy
chmod +x deploy.sh setup-ssl.sh
./deploy.sh
```

Your app will be available at `http://YOUR_EC2_PUBLIC_IP`

## Step 6: Set Up SSL (Optional but Recommended)

If you have a domain:

1. Point your domain's A record to your EC2's public IP
2. Wait for DNS propagation (can take up to 48 hours)
3. Run SSL setup:

```bash
./setup-ssl.sh yourdomain.com
```

## Managing the Application

### View logs
```bash
cd /opt/one-word-story/deploy
docker compose -f docker-compose.prod.yml logs -f
```

### Restart services
```bash
docker compose -f docker-compose.prod.yml restart
```

### Stop services
```bash
docker compose -f docker-compose.prod.yml down
```

### Update application
```bash
cd /opt/one-word-story
git pull
cd deploy
./deploy.sh
```

## Free Tier Limits to Watch

| Resource | Free Tier Limit |
|----------|----------------|
| EC2 t2.micro | 750 hours/month (first 12 months) |
| EBS Storage | 30 GB |
| Data Transfer | 100 GB out/month |
| Elastic IP | Free while attached to running instance |

## Troubleshooting

### App not accessible
- Check EC2 security group allows ports 80/443
- Check if containers are running: `docker ps`
- Check logs: `docker compose -f docker-compose.prod.yml logs`

### Database connection errors
- Wait for database to be healthy: `docker compose -f docker-compose.prod.yml ps`
- Check database logs: `docker compose -f docker-compose.prod.yml logs db`

### Out of memory (t2.micro has 1GB RAM)
- Add swap space:
```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Cost Optimization

- Use **Elastic IP** only if you need a static IP (free while attached)
- Monitor usage in **AWS Billing Dashboard**
- Set up **Billing Alerts** to avoid surprises
- Stop instance when not in use (data persists on EBS)
