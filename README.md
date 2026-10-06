# Remont App

## Start

1. Copy .env.example to .env and fill it.
2. Run docker compose up -d.
3. Backend is on port 8000.

## Backup

PostgreSQL backup is done via daily pg_dump inside a cron container. See docker-compose.prod.yml.

## Mobile

Built with Flutter.
