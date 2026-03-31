# Production Deployment Guide

## 🚀 Brizzzo Messaging - Production Deployment

This guide covers deploying the Brizzzo messaging backend to production.

## Prerequisites

- Docker & Docker Compose installed on production server
- Domain name configured
- SSL certificate (Let's Encrypt recommended)
- Strong passwords and secrets generated

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/Attahjonah/brizzzo.git
cd brizzzo-backend
```

### 2. Configure Environment Variables

Create a `.env` file with production values:

```bash
# Database
DB_HOST=mysql
DB_USER=brizzzo_prod
DB_PASSWORD=your_strong_db_password_here
DB_NAME=brizzzo_prod

# Redis
REDIS_HOST=redis
REDIS_PASSWORD=your_strong_redis_password_here

# JWT
JWT_SECRET=your_256_bit_jwt_secret_here

# App
NODE_ENV=production
PORT=3000
```

### 3. Update Docker Compose for Production

Modify `docker-compose.yml` for production:

```yaml
version: '3.8'
services:
  mysql:
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - brizzzo-network

  redis:
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - brizzzo-network

  app1:
    build: .
    environment:
      - DB_HOST=${DB_HOST}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
      - REDIS_HOST=${REDIS_HOST}
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - mysql
      - redis
    networks:
      - brizzzo-network

  # Add more app instances for scaling
  app2:
    # Same config as app1

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"  # For SSL
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl  # Mount SSL certificates
    depends_on:
      - app1
      - app2
    networks:
      - brizzzo-network

volumes:
  mysql_data:
  redis_data:

networks:
  brizzzo-network:
    driver: bridge
```

### 4. SSL Configuration

#### Using Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt update
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to ssl directory
sudo mkdir ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
```

#### Update nginx.conf for SSL

```nginx
upstream brizzzo_backend {
    server app1:3000;
    server app2:3000;
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://brizzzo_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Security Hardening

#### Database Security
- Use strong passwords (20+ characters)
- Restrict database access to application only
- Enable MySQL binary logging for backups

#### Redis Security
- Set strong Redis password
- Bind Redis to localhost only (not exposed externally)
- Enable Redis persistence

#### Application Security
- Use strong JWT secrets (256-bit)
- Implement proper WebSocket authentication
- Enable rate limiting
- Regular security updates

### 6. Monitoring & Logging

#### Basic Monitoring
```bash
# Check service health
docker-compose ps

# View logs
docker-compose logs -f

# Monitor resource usage
docker stats
```

#### Advanced Monitoring (Recommended)
- Set up Prometheus + Grafana for metrics
- Configure log aggregation (ELK stack)
- Set up alerts for service failures

### 7. Backup Strategy

#### Database Backups
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec mysql mysqldump -u root -p${DB_PASSWORD} ${DB_NAME} > backup_${DATE}.sql
```

#### Automated Backups
```bash
# Add to crontab for daily backups
0 2 * * * /path/to/backup-script.sh
```

### 8. Scaling

#### Horizontal Scaling
Add more app instances to `docker-compose.yml`:

```yaml
  app3:
    build: .
    environment: [same as app1]
    depends_on: [mysql, redis]
    networks: [brizzzo-network]

  app4:
    # Same config
```

#### Vertical Scaling
Increase resource limits in docker-compose.yml:

```yaml
  app1:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 9. Deployment Commands

```bash
# Initial deployment
docker-compose up -d --build

# Update deployment
git pull
docker-compose up -d --build

# Zero-downtime updates
docker-compose up -d app1  # Update one instance at a time
docker-compose up -d app2
```

### 10. Troubleshooting

#### Common Issues

**WebSocket Connection Issues:**
- Check nginx WebSocket proxy configuration
- Verify SSL certificate validity
- Ensure proper CORS settings

**Database Connection Issues:**
- Verify environment variables
- Check MySQL container logs
- Test database connectivity

**Load Balancing Issues:**
- Verify nginx upstream configuration
- Check app instance health
- Monitor nginx access logs

#### Health Checks

```bash
# API health check
curl https://yourdomain.com/health

# WebSocket test
# Open browser console and test Socket.IO connection
```

## Performance Optimization

### Database Optimization
- Enable query caching
- Set up proper indexes
- Monitor slow queries

### Redis Optimization
- Configure appropriate memory limits
- Set up Redis persistence
- Monitor cache hit rates

### Application Optimization
- Implement connection pooling
- Use gzip compression
- Optimize static asset delivery

## Security Checklist

- [ ] Strong passwords for all services
- [ ] SSL/TLS enabled
- [ ] WebSocket authentication implemented
- [ ] Rate limiting configured
- [ ] Database access restricted
- [ ] Regular security updates
- [ ] Firewall configured
- [ ] Backup strategy in place
- [ ] Monitoring and alerting set up

## Maintenance

### Regular Tasks
- Monitor logs for errors
- Update Docker images regularly
- Rotate SSL certificates
- Test backup restoration
- Performance monitoring

### Emergency Procedures
- Rollback deployment: `docker-compose up -d --no-deps [service]`
- Database recovery from backups
- Service restart procedures

---

**Note**: This is a comprehensive production deployment guide. Adjust configurations based on your specific infrastructure and security requirements.