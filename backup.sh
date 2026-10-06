#!/bin/bash
mkdir -p backups
docker exec remont-db-1 pg_dump -U postgres remont > backups/remont_$(date +%F).sql
