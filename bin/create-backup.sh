#!/usr/bin/env bash

# Go to script dir.
cd $(dirname "$0") 

# Backup images.
tar zvcf ../dump/img-$(date +%Y-%h-%d@%T).tar.gz ../dist/img/ ../dist/banner/

# Backup db.
mongodump --db zunka -u admin --authenticationDatabase admin --gzip --archive=../dump/db-$(date +%Y-%h-%d@%T).gz
