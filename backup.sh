#!/bin/bash
# Automatic Database Backup Script for AI Virtual Company OS

# Define directory for backups
BACKUP_DIR="/mnt/d/explore/company virtual/backups"
mkdir -p "$BACKUP_DIR"

# Timestamp for the filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="company_os_backup_${TIMESTAMP}.sql"

echo "Starting database backup..."

# Execute pg_dump inside the docker container
docker exec company-os-db pg_dump -U company_admin company_os > "${BACKUP_DIR}/${FILENAME}"

if [ $? -eq 0 ]; then
  echo "Backup successfully created: ${BACKUP_DIR}/${FILENAME}"
  # Keep only the last 7 backups to prevent disk bloat
  find "$BACKUP_DIR" -name "company_os_backup_*.sql" -type f -mtime +7 -delete
  echo "Cleaned up old backups."
else
  echo "Backup failed!"
  exit 1
fi
