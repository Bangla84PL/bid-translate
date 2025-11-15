# 🖥️ VPS Configuration Guide
**Server: srv867044.hstgr.cloud**  
**Last Updated:** November 12, 2025  
**Classification:** PUBLIC - Technical Documentation (No Sensitive Data)

---

## 📋 Executive Summary

This document provides complete technical configuration details for the VPS hosting n8n, Traefik, Flowise, Gotenberg, and Supabase services. All sensitive credentials have been removed - refer to the separate credentials file for authentication details.

### 🏗️ Architecture Overview
- **Reverse Proxy:** Traefik v2.10 with automatic SSL
- **Automation:** n8n (latest) with encryption
- **AI Chatflows:** Flowise (latest) - AI workflow builder
- **PDF Processing:** Gotenberg v8 - Document conversion service
- **Backend:** Supabase (complete self-hosted stack)
- **Backup:** Automated Google Drive integration
- **Monitoring:** Custom health checks and monitoring

---

## 🖥️ System Information

### Server Specifications
```
Hostname: srv867044.hstgr.cloud
OS: Ubuntu 22.04.3 LTS (6.8.0-60-generic)
Architecture: x86_64
Storage: 96GB SSD (51% used - 49GB/96GB available)
Memory: 8GB RAM
CPU: Multi-core x86_64
```

### Network Configuration
```
Domains:
  - smartcamp.ai (main domain)
  - n8n.smartcamp.ai (n8n interface)
  - api.supabase.smartcamp.ai (Supabase API)
  - supabase.smartcamp.ai (Supabase Studio)
  - traefik.smartcamp.ai (Traefik dashboard)
  - flowise.smartcamp.ai (Flowise AI chatflows)
  - gotenberg.smartcamp.ai (Gotenberg PDF service)
```

---

## 🌐 Traefik Configuration (Reverse Proxy)

### Location & Structure
```
/root/docker-compose.yml (Main Traefik configuration)
```

### Configuration Details
```yaml
version: '3.8'
services:
  traefik:
    image: traefik:v2.10
    restart: always
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=kontakt@smartcamp.ai"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--global.sendanonymoususage=false"
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
      - "--entrypoints.web.http.redirections.entryPoint.scheme=https"
    ports:
      - "80:80"     # HTTP (redirects to HTTPS)
      - "443:443"   # HTTPS
      - "8080:8080" # Dashboard
    volumes:
      - traefik_data:/letsencrypt
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`traefik.smartcamp.ai`)"
      - "traefik.http.routers.dashboard.service=api@internal"
      - "traefik.http.routers.dashboard.entrypoints=websecure"
      - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"
      - "traefik.http.routers.dashboard.middlewares=auth"
      # Basic auth middleware - credentials configured separately

networks:
  traefik:
    external: true

volumes:
  traefik_data:
    driver: local
```

### SSL Configuration
- **Provider:** Let's Encrypt
- **Challenge:** TLS Challenge
- **Email:** kontakt@smartcamp.ai
- **Storage:** /letsencrypt/acme.json (in traefik_data volume)

### Dashboard Access
- **URL:** https://traefik.smartcamp.ai
- **Authentication:** Basic Auth (credentials in separate file)

### Security Features
- Automatic HTTP to HTTPS redirect
- TLS certificate auto-renewal
- Docker socket protection (read-only)
- Anonymous usage tracking disabled

---

## 🤖 n8n Configuration (Automation Platform)

### Location & Structure
```
/root/n8n/docker-compose.yml (n8n service configuration)
/root/n8n-data/ (n8n application data)
/root/n8n-files/ (n8n file storage)
```

### Service Configuration
```yaml
version: '3.8'
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    restart: always
    environment:
      - N8N_HOST=n8n.smartcamp.ai
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - N8N_BASIC_AUTH_ACTIVE=false
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}  # Critical - from env file
      - N8N_API_DISABLED=false
      - WEBHOOK_URL=https://n8n.smartcamp.ai/
    ports:
      - "127.0.0.1:5678:5678"
    volumes:
      - /root/n8n-data:/home/node/.n8n
      - /root/n8n-files:/files
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.n8n.rule=Host(`n8n.smartcamp.ai`)"
      - "traefik.http.routers.n8n.entrypoints=websecure"
      - "traefik.http.routers.n8n.tls.certresolver=letsencrypt"
      - "traefik.http.services.n8n.loadbalancer.server.port=5678"

networks:
  traefik:
    external: true
```

### Critical Security Settings
```bash
# Basic Authentication - disabled (using Traefik auth)
N8N_BASIC_AUTH_ACTIVE=false

# Encryption Key - CRITICAL for data recovery
# Stored in separate credentials file
N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}

# API Access
N8N_API_DISABLED=false
WEBHOOK_URL=https://n8n.smartcamp.ai/
```

### Data Storage
- **Application Data:** `/root/n8n-data/` (workflows, credentials, settings)
- **File Storage:** `/root/n8n-files/` (uploaded files, exports)
- **Database:** SQLite (embedded in n8n-data)
- **Encryption:** AES-256 (key stored separately)

### Access Information
- **URL:** https://n8n.smartcamp.ai
- **Authentication:** Protected by Traefik Basic Auth

---

## 🤖 Flowise Configuration (AI Chatflow Builder)

### Location & Structure
```
/root/flowise/docker-compose.yml (Flowise service configuration)
/root/flowise-data/ (Flowise application data)
```

### Service Configuration
```yaml
version: '3.8'
services:
  flowise:
    image: flowiseai/flowise:latest
    restart: always
    environment:
      - PORT=3000
      - FLOWISE_USERNAME=${FLOWISE_USERNAME}
      - FLOWISE_PASSWORD=${FLOWISE_PASSWORD}
      - FLOWISE_FILE_SIZE_LIMIT=50mb
      - CORS_ORIGINS=*
      - IFRAME_ORIGINS=*
      - FLOWISE_SECRETKEY_OVERWRITE=${FLOWISE_SECRET_KEY}
      - LOG_LEVEL=info
      - LOG_PATH=/root/.flowise/logs
      - APIKEY_PATH=/root/.flowise
      - SECRETKEY_PATH=/root/.flowise
      - BLOB_STORAGE_PATH=/root/.flowise/storage
    ports:
      - "127.0.0.1:3001:3000"
    volumes:
      - /root/flowise-data:/root/.flowise
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.flowise.rule=Host(`flowise.smartcamp.ai`)"
      - "traefik.http.routers.flowise.entrypoints=websecure"
      - "traefik.http.routers.flowise.tls.certresolver=letsencrypt"
      - "traefik.http.services.flowise.loadbalancer.server.port=3000"

networks:
  traefik:
    external: true
```

### Data Storage
- **Application Data:** `/root/flowise-data/` (chatflows, credentials, settings)
- **API Keys:** Stored in `/root/flowise-data/`
- **Logs:** `/root/flowise-data/logs/`
- **Encryption Key:** Shared with n8n (stored separately)

### Access Information
- **URL:** https://flowise.smartcamp.ai
- **Authentication:** Username/Password (credentials in separate file)

---

## 📄 Gotenberg Configuration (PDF Conversion Service)

### Location & Structure
```
/root/gotenberg/docker-compose.yml (Gotenberg service configuration)
```

### Service Configuration
```yaml
version: '3.8'
services:
  gotenberg:
    image: gotenberg/gotenberg:8
    container_name: gotenberg
    restart: unless-stopped
    environment:
      - GOTENBERG_LOG_LEVEL=info
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.gotenberg.rule=Host(`gotenberg.smartcamp.ai`)"
      - "traefik.http.routers.gotenberg.entrypoints=websecure"
      - "traefik.http.routers.gotenberg.tls.certresolver=letsencrypt"
      - "traefik.http.services.gotenberg.loadbalancer.server.port=3000"
      - "traefik.http.routers.gotenberg.middlewares=gotenberg-auth,gotenberg-ratelimit"
      # Auth middleware - credentials configured separately

networks:
  traefik:
    external: true
```

### Features
- PDF conversion from HTML, Markdown, Office documents
- Merge, split, and manipulate PDFs
- Image conversion and processing
- Protected by Basic Auth and rate limiting via Traefik

### Access Information
- **URL:** https://gotenberg.smartcamp.ai
- **Authentication:** HTTP Basic Auth (credentials in separate file)
- **Rate Limit:** 60 requests/minute (burst: 30)

---

## 🗄️ Supabase Configuration (Backend-as-a-Service)

### Location & Structure
```
/root/supabase/ (main configuration directory)
├── docker-compose.yml (service definitions)
├── env-file.txt (environment variables)
└── volumes/ (configuration files)
    ├── api/ (Kong API gateway config)
    ├── db/ (PostgreSQL initialization)
    ├── functions/ (Edge functions)
    ├── logs/ (Vector logging config)
    └── pooler/ (Connection pooler config)
```

### Service Architecture
Supabase consists of 13 interconnected services:

#### Core Services
1. **supabase-db** (PostgreSQL 15.8.1.060)
   - Port: 127.0.0.1:5432
   - Database: postgres
   - User: postgres
   - Password: Stored in env file

2. **supabase-kong** (API Gateway - Kong 2.8.1)
   - Ports: 8000 (HTTP), 8443 (HTTPS)
   - Routes all API traffic
   - Handles authentication

3. **supabase-auth** (Authentication - GoTrue v2.176.1)
   - Handles user authentication
   - JWT token management

4. **supabase-storage** (File Storage - v1.24.7)
   - Port: 127.0.0.1:5000
   - File storage backend
   - Image processing integration

5. **supabase-rest** (PostgREST v12.2.12)
   - Auto-generated REST API
   - Direct database access

#### Supporting Services
6. **supabase-realtime** (Real-time subscriptions)
7. **supabase-meta** (Database metadata)
8. **supabase-studio** (Admin dashboard - latest version)
9. **supabase-analytics** (Logflare analytics)
10. **supabase-vector** (Log collection - latest version)
11. **supabase-imgproxy** (Image processing - latest version)
12. **supabase-pooler** (Connection pooling)
13. **supabase-edge-functions** (Serverless functions)

### Configuration Structure (env-file.txt)

#### JWT & Authentication
```bash
JWT_SECRET=${SUPABASE_JWT_SECRET}
JWT_EXPIRY=3600
ANON_KEY=${SUPABASE_ANON_KEY}
SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
```

#### Database Configuration
```bash
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432
POSTGRES_PASSWORD=${SUPABASE_DB_PASSWORD}
```

#### External URLs
```bash
API_EXTERNAL_URL=https://api.supabase.smartcamp.ai
SUPABASE_PUBLIC_URL=https://api.supabase.smartcamp.ai
SITE_URL=https://supabase.smartcamp.ai
```

#### OpenAI Integration
```bash
OPENAI_API_KEY=${OPENAI_API_KEY}
```

#### Google Cloud Integration
```bash
GOOGLE_PROJECT_ID=${GOOGLE_PROJECT_ID}
GOOGLE_PROJECT_NUMBER=${GOOGLE_PROJECT_NUMBER}
```

#### Email Configuration
```bash
SMTP_ADMIN_EMAIL=hello@smartcamp.ai
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=hello@smartcamp.ai
SMTP_PASS=${SMTP_PASSWORD}
SMTP_SENDER_NAME=SmartCamp Notifications
```

#### Analytics & Logging
```bash
LOGFLARE_PRIVATE_ACCESS_TOKEN=${LOGFLARE_PRIVATE_TOKEN}
LOGFLARE_PUBLIC_ACCESS_TOKEN=${LOGFLARE_PUBLIC_TOKEN}
```

#### Connection Pooling
```bash
SECRET_KEY_BASE=${SUPABASE_SECRET_KEY_BASE}
```

### Studio Access
- **URL:** https://supabase.smartcamp.ai
- **Authentication:** Basic Auth via Traefik (credentials in separate file)

### Storage Buckets
Current buckets in production:
1. **images** - General image storage
2. **smartcamp.ai-visuals** - Brand and marketing assets
3. **social-media-ai-generated** - AI-generated social media content

Total storage usage: 112MB

---

## 🐳 Docker Configuration

### Network Architecture
```bash
# External network shared by all services
docker network create traefik
```

All services connect to the `traefik` network for inter-service communication and external access.

### Volume Management

#### Current Volumes
```bash
# Traefik
traefik_data                    # SSL certificates and Traefik data

# n8n
n8n_data                       # n8n application data (legacy)
root_n8n_data                  # Current n8n data

# Supabase (Fixed naming)
supabase_db_data               # PostgreSQL database (ACTIVE)
supabase_storage_data          # File storage (ACTIVE)

# Legacy Supabase volumes (can be removed)
supabase_supabase_db_data      # Old database volume
supabase_supabase_storage_data # Old storage volume
```

#### Volume Naming Convention
**CRITICAL:** Volume names are explicitly defined to prevent naming conflicts:

```yaml
volumes:
  supabase_db_data:
    driver: local
    name: supabase_db_data
  supabase_storage_data:
    driver: local
    name: supabase_storage_data
```

This ensures consistent naming regardless of Docker Compose project context.

### Container Naming Convention
```bash
# Traefik
root_traefik_1

# n8n
n8n_n8n_1

# Flowise
flowise_flowise_1

# Gotenberg
gotenberg

# Supabase (all prefixed with 'supabase-')
supabase-db
supabase-kong
supabase-auth
supabase-storage
supabase-rest
supabase-realtime
supabase-meta
supabase-studio
supabase-analytics
supabase-vector
supabase-imgproxy
supabase-pooler
supabase-edge-functions
```

---

## 💾 Backup System

### Automated Backup Schedule
```bash
# Cron configuration
0 3 */3 * * /root/n8n-backup.sh >> /var/log/n8n-backup.log 2>&1
10 3 */3 * * /root/supabase-backup.sh >> /var/log/supabase-backup.log 2>&1
```

### Backup Scripts

#### 1. n8n Backup (`/root/n8n-backup.sh`)
**What it backs up:**
- Complete n8n-data directory (workflows, credentials, settings)
- n8n-files directory (uploaded files)
- Encryption key validation

**Process:**
1. Validates encryption key exists
2. Stops n8n container (prevents SQLite corruption)
3. Creates tar.gz archive
4. Restarts n8n container
5. Uploads to Google Drive
6. Cleans local copy
7. Retains 5 most recent backups

#### 2. Supabase Backup (`/root/supabase-backup.sh`)
**What it backs up:**
- Database dump (all schemas: auth, storage, public)
- Docker volumes (supabase_db_data, supabase_storage_data)
- Configuration files (docker-compose.yml, env-file.txt, volumes/)

**Process:**
1. Validates volume existence
2. Creates PostgreSQL dump
3. Creates configuration backup
4. Stops containers
5. Creates volume archive
6. Restarts containers
7. Uploads all backups to Google Drive
8. Retains 7 most recent backups

### Google Drive Integration
```bash
# rclone configuration
Remote: gdrive
Type: drive
```

**Backup Directories:**
- `gdrive:n8n-backups/` - n8n backups
- `gdrive:supabase-backups/` - Supabase backups

### Monitoring Script (`/root/supabase-backup-monitor.sh`)
**Features:**
- Container health verification
- Backup age monitoring (alerts if >5 days old)
- Volume size reporting
- Bucket verification
- Disk usage monitoring
- Cron job verification

**Usage:**
```bash
./supabase-backup-monitor.sh
```

**Logs:** `/var/log/supabase-backup-monitor.log`

---

## 🔄 Disaster Recovery Procedures

### Complete System Rebuild

#### 1. Server Setup
```bash
# Fresh Ubuntu 22.04 installation
apt update && apt upgrade -y
apt install docker.io docker-compose-v2 curl wget -y
systemctl enable docker
systemctl start docker
```

#### 2. Network Creation
```bash
docker network create traefik
```

#### 3. rclone Setup
```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure Google Drive access
rclone config
# Follow prompts to set up 'gdrive' remote
```

#### 4. Restore Scripts
```bash
# Download restore scripts from backup
rclone copy gdrive:supabase-backups/supabase-restore.sh /root/
chmod +x /root/supabase-restore.sh
```

#### 5. Service Restoration
```bash
# Restore Traefik first
mkdir -p /root
# Recreate docker-compose.yml for Traefik

# Restore n8n
# Download and extract n8n backup
# Recreate n8n docker-compose.yml

# Restore Supabase
./supabase-restore.sh
# Choose option 1: Full restore
```

### Partial Recovery Scenarios

#### n8n Data Loss
```bash
# Stop n8n
docker stop n8n-n8n-1

# Download latest backup
rclone copy gdrive:n8n-backups/[latest-backup] /root/

# Extract to correct locations
tar -xzf [backup-file] -C /root/

# Restart n8n
docker start n8n-n8n-1
```

#### Supabase Database Corruption
```bash
./supabase-restore.sh
# Choose option 2: Database only restore
```

#### Configuration Issues
```bash
./supabase-restore.sh
# Choose option 3: Configuration only restore
```

---

## 🔐 Security Configuration

### SSL/TLS
- **Provider:** Let's Encrypt
- **Renewal:** Automatic via Traefik
- **Protocols:** TLS 1.2, TLS 1.3
- **Certificates stored in:** traefik_data volume

### Authentication Systems

All services are protected by authentication:
- **Traefik Dashboard:** HTTP Basic Auth
- **n8n:** Protected by Traefik Basic Auth
- **Flowise:** Username/Password authentication
- **Gotenberg:** HTTP Basic Auth
- **Supabase Studio:** HTTP Basic Auth via Traefik

*(All credentials stored in separate credentials file)*

### Network Security
- **Internal Communication:** Docker network isolation
- **External Access:** Only through Traefik reverse proxy
- **Port Exposure:** Minimal (only 80, 443, 8080)
- **Local Bindings:** Database and storage services bound to 127.0.0.1

### API Security
- **JWT Tokens:** RS256 algorithm
- **Rate Limiting:** 60 requests/minute
- **CORS:** Restricted to specific domains
- **Row Level Security:** Enabled in PostgreSQL

---

## 📊 Monitoring & Maintenance

### Health Checks
All Supabase containers include health checks:
- **Database:** `pg_isready` command
- **Storage:** HTTP endpoint verification
- **Auth:** HTTP health endpoint
- **API Gateway:** Kong health command

### Log Management
```bash
# Service logs
docker logs [container-name]

# Backup logs
/var/log/n8n-backup.log
/var/log/supabase-backup.log
/var/log/supabase-backup-monitor.log

# System logs
journalctl -u docker
```

### Performance Monitoring
- **Disk Usage:** 51% (49GB/96GB)
- **Container Resource Usage:** Monitored via `docker stats`
- **Database Size:** 60MB
- **Storage Size:** 112MB
- **Total Containers:** 17 (Traefik, n8n, Flowise, Gotenberg + 13 Supabase services)

### Maintenance Tasks
1. **Weekly:** Review backup logs
2. **Monthly:** Check disk usage and cleanup old files
3. **Quarterly:** Update container images
4. **Annually:** Rotate API keys and passwords

---

## 🚨 Troubleshooting Guide

### Common Issues

#### Container Won't Start
```bash
# Check logs
docker logs [container-name]

# Check resource usage
docker stats

# Verify network connectivity
docker network inspect traefik
```

#### SSL Certificate Issues
```bash
# Check Traefik logs
docker logs root-traefik-1

# Verify domain DNS
nslookup [domain]

# Manual certificate renewal
docker exec root-traefik-1 traefik healthcheck
```

#### Database Connection Issues
```bash
# Check PostgreSQL health
docker exec supabase-db pg_isready -U postgres

# Verify credentials
docker exec supabase-db psql -U postgres -c "SELECT version();"

# Check port bindings
netstat -tlnp | grep 5432
```

#### Storage Issues
```bash
# Check storage service health
curl -s http://localhost:5000/health

# Verify bucket access
docker exec supabase-db psql -U postgres -d postgres -c "SELECT * FROM storage.buckets;"

# Check file system
ls -la /var/lib/docker/volumes/supabase_storage_data/_data/
```

---

## 📝 Change Log

### Recent Changes (November 2025)
- ✅ Updated all Docker containers to latest versions
- ✅ n8n: Updated to latest version (from v1.103.2)
- ✅ Supabase Studio: Updated to latest version
- ✅ Flowise: Updated to latest version
- ✅ Gotenberg: Updated to version 8
- ✅ Supabase Vector & ImgProxy: Updated to latest versions
- ✅ Documented Flowise AI chatflow builder configuration
- ✅ Documented Gotenberg PDF conversion service
- ✅ All services tested and operational
- ✅ Updated disk usage metrics (51% used)

### Recent Changes (July 2025)
- ✅ Fixed Supabase volume naming consistency
- ✅ Migrated storage data to new volumes
- ✅ Updated backup scripts for new volume names
- ✅ Fixed storage container health checks
- ✅ Added comprehensive monitoring script
- ✅ Created disaster recovery documentation

### Known Issues
- n8n workflow has pre-existing Google credentials authorization error (needs manual refresh)
- Legacy volumes still present (safe to remove after verification)
- SMTP configuration needs valid Gmail app-specific password

---

## 🔗 Quick Reference

### Service URLs
- **Traefik Dashboard:** https://traefik.smartcamp.ai
- **n8n Interface:** https://n8n.smartcamp.ai
- **Flowise AI:** https://flowise.smartcamp.ai
- **Gotenberg PDF:** https://gotenberg.smartcamp.ai
- **Supabase Studio:** https://supabase.smartcamp.ai
- **Supabase API:** https://api.supabase.smartcamp.ai

### Critical Files
```
/root/docker-compose.yml                 # Traefik configuration
/root/n8n/docker-compose.yml            # n8n configuration
/root/flowise/docker-compose.yml        # Flowise configuration
/root/gotenberg/docker-compose.yml      # Gotenberg configuration
/root/supabase/docker-compose.yml       # Supabase configuration
/root/supabase/env-file.txt             # All environment variables
/root/supabase-backup.sh                # Supabase backup script
/root/n8n-backup.sh                     # n8n backup script
/root/supabase-restore.sh               # Disaster recovery script
/root/SUPABASE_BACKUP_GUIDE.md          # Backup documentation
```

### Critical Commands
```bash
# Start all services
docker-compose up -d

# Check service health
docker ps --format "table {{.Names}}\t{{.Status}}"

# Manual backup
./supabase-backup.sh
./n8n-backup.sh

# Monitor system
./supabase-backup-monitor.sh

# View logs
docker logs [container-name]
```

---

**Document Classification:** PUBLIC - Technical Documentation  
**Last Updated:** November 12, 2025  
**Next Review:** February 12, 2026  

*This document contains technical configuration information without sensitive credentials. Refer to the separate credentials file for authentication details.*

