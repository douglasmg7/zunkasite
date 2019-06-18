#!/usr/bin/env bash

# Go to script dir.
cd $(dirname "$0") 

# Backup images.
# tar cvzf ../dump/img-$(date +%Y-%h-%d@%T).tar.gz ../dist/img/ ../dist/banner/   # Tar err if this name format.
tar cvzf ../dump/img-$(date +%Y-%h-%d).tar.gz ../dist/img/ ../dist/banner/

# Backup db.
# mongodump --db zunka -u admin --authenticationDatabase admin --gzip --archive=../dump/db-$(date +%Y-%h-%d@%T).gz    # Tar err if this name format.
mongodump --db zunka -u admin --authenticationDatabase admin --gzip --archive=../dump/db-$(date +%Y-%h-%d).gz
