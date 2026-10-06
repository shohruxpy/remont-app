# Remont App - Production Setup

## Server Requirements
- OS: Ubuntu 22.04 LTS or similar Linux
- CPU: 2+ cores, RAM: 4GB+
- Disk: 20GB+ SSD
- Software: Docker, Docker Compose

## Ports
- 80 (HTTP) -> Redirects to HTTPS
- 443 (HTTPS) -> Web Panel (Nginx) & API Backend
- 5432 -> PostgreSQL (internal network only)

## HTTPS Setup
Use Let's Encrypt / Certbot with the Nginx reverse proxy.
1. Place certificates in `./certs`
2. Configure `nginx.conf` to use `/etc/ssl/certs/...`

## Backups
A pg_dump backup script is provided in `./backup.sh`. 
Cron job recommendation (daily at 2 AM):
`0 2 * * * cd /path/to/app && ./backup.sh`
