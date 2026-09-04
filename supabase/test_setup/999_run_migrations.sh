#!/bin/bash
set -e
for file in /migrations/*.sql; do
    echo "Running $file"
    psql $DATABASE_URL -f "$file"
done