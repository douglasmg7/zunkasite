#!/usr/bin/env bash

# Go to script dir.
cd $(dirname "$0") 

# Backup images.
# tar cvzf ../dump/img-$(date +%Y-%h-%d@%T).tar.gz ../dist/img/ ../dist/banner/   # Tar err if this name format.
tar cvzf ../dump/img-$(date +%Y-%h-%d).tar.gz ../dist/img/ ../dist/banner/

# Mongo backup.
# mongodump --db zunka -u admin --authenticationDatabase admin --gzip --archive=../dump/db-$(date +%Y-%h-%d@%T).gz    # Tar err if this name format.
mongodump --db zunka -u admin --authenticationDatabase admin --gzip --archive=../dump/db-$(date +%Y-%h-%d).gz

# Redis backup.
redis-cli save
sudo cp var/lib/redis/dump.rdb ../dump/dump-$(date +%Y-%h-%d).rdb
