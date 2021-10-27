#!/usr/bin/env bash

# Check environments variables
for val in \
    ZUNKAPATH \
    ZUNKA_FREIGHT_DB \
    ZUNKA_SRV_DB \
    ZUNKA_FREIGHT_DB \
    ZUNKA_SITE_PATH \
    ALLNATIONS_DB
do
    if [ -z ${!val} ]; then
        printf "error: $val not defined\n" >&2
        MISSING_VAR=true
    fi
done

if [ $MISSING_VAR ]; then
    exit 1
fi

FREIGHT_FILE_DB=$ZUNKAPATH/db/$ZUNKA_FREIGHT_DB
ZUNKASRV_FILE_DB=$ZUNKAPATH/db/$ZUNKA_SRV_DB
ALDOWSC_FILE_DB=$ZUNKAPATH/db/$ZUNKA_ALDOWSC_DB
MOTOSPEED_DB=$MOTOSPEED_DB

# Backup dir.
BACKUP_DIR=$ZUNKA_SITE_PATH/dump/$(date +%Y-%m-%d)

# Check if freight db exist.
if [[ ! -f $FREIGHT_FILE_DB ]]; then
    printf "error: $FREIGHT_FILE_DB not exist.\n" >&2
    exit
fi

# Check if zunkasrv db exist.
if [[ ! -f $ZUNKASRV_FILE_DB ]]; then
    printf "error: $ZUNKASRV_FILE_DB not exist.\n" >&2
    exit
fi

# Check if aldowsc db exist.
if [[ ! -f $ALDOWSC_FILE_DB ]]; then
    printf "error: $ALDOWSC_FILE_DB not exist.\n" >&2
    exit
fi

# Check if allnations db exist.
if [[ ! -f $ALLNATIONS_DB ]]; then
    printf "error: $ALLNATIONS_DB not exist.\n" >&2
    exit
fi

# Check if motospeed db exist.
if [[ ! -f $MOTOSPEED_DB ]]; then
    printf "error: $MOTOSPEED_DB not exist.\n" >&2
    exit
fi

# Create backup dir.
mkdir -p $BACKUP_DIR

echo Creating $FREIGHT_FILE_DB backup...
sqlite3 $FREIGHT_FILE_DB ".backup $BACKUP_DIR/sqlite3.freight.backup"

echo Creating $ZUNKASRV_FILE_DB backup...
sqlite3 $ZUNKASRV_FILE_DB ".backup $BACKUP_DIR/sqlite3.zunkasrv.backup"

echo Creating $ALDOWSC_FILE_DB backup...
sqlite3 $ALDOWSC_FILE_DB ".backup $BACKUP_DIR/sqlite3.aldowsc.backup"

echo Creating $ALLNATIONS_DB backup...
sqlite3 $ALLNATIONS_DB ".backup $BACKUP_DIR/sqlite3.allnations.backup"

echo Creating $MOTOSPEED_DB backup...
sqlite3 $MOTOSPEED_DB ".backup $BACKUP_DIR/sqlite3.motospeed.backup"

# Mongo backup.
# mongodump --db zunka -u admin --authenticationDatabase admin --gzip --archive=../dump/db-$(date +%Y-%h-%d@%T).gz    # Tar err if this name format.
echo Creating mongodb backup...
printf "\nMongo db admin password:\n"
mongodump --db zunka -u admin --authenticationDatabase admin --gzip --archive=$BACKUP_DIR/mongodb.gz

# Redis backup.
echo Creating redis backup...
redis-cli save
printf "\nroot password:\n"
sudo cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis.rdb
sudo chown douglasmg7:users $BACKUP_DIR/redis.rdb
# chgrp users $BACKUP_DIR/redis.rdb

# Backup images.
echo Creating images backup...
cd $ZUNKA_SITE_PATH
pwd
tar cvzf $BACKUP_DIR/img.tar.gz ./dist/img ./dist/banner
cd -

echo Finished
