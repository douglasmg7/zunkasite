#!/usr/bin/env bash

# ZUNKAPATH not defined.
if [ -z "$ZUNKAPATH" ]; then
	printf "error: ZUNKAPATH not defined.\n" >&2
	exit 1 
fi

# ZUNKA_FREIGHT_DB not defined.
if [ -z "$ZUNKA_FREIGHT_DB" ]; then
	printf "error: ZUNKA_FREIGHT_DB not defined.\n" >&2
	exit 1 
fi

# ZUNKA_SRV_DB not defined.
if [ -z "$ZUNKA_SRV_DB" ]; then
	printf "error: ZUNKA_SRV_DB not defined.\n" >&2
	exit 1 
fi

# ZUNKA_FREIGHT_DB not defined.
if [ -z "$ZUNKA_FREIGHT_DB" ]; then
	printf "error: ZUNKA_FREIGHT_DB not defined.\n" >&2
	exit 1 
fi

# ZUNKA_SITE_PATH not defined.
if [ -z "$ZUNKA_SITE_PATH" ]; then
	printf "error: ZUNKA_SITE_PATH not defined.\n" >&2
	exit 1 
fi

FREIGHT_FILE_DB=$ZUNKAPATH/db/$ZUNKA_FREIGHT_DB
ZUNKASRV_FILE_DB=$ZUNKAPATH/db/$ZUNKA_SRV_DB
ALDOWSC_FILE_DB=$ZUNKAPATH/db/$ZUNKA_ALDOWSC_DB

# Backup dir.
BACKUP_DIR=$ZUNKA_SITE_PATH/dump/$(date +%Y-%h-%d)

# echo $FREIGHT_FILE_DB
# echo $ZUNKASRV_FILE_DB
# echo $ALDOWSC_FILE_DB
# echo $BACKUP_DIR
# echo $FREIGHT_BACKUP
# echo $ZUNKASRV_BACKUP
# echo $ALDOWSC_BACKUP

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

# Create backup dir.
mkdir -p $BACKUP_DIR

echo Creating $FREIGHT_FILE_DB backup...
sqlite3 $FREIGHT_FILE_DB ".backup $BACKUP_DIR/sqlite3.freight.backup"

echo Creating $ZUNKASRV_FILE_DB backup...
sqlite3 $ZUNKASRV_FILE_DB ".backup $BACKUP_DIR/sqlite3.zunkasrv.backup"

echo Creating $ALDOWSC_FILE_DB backup...
sqlite3 $ALDOWSC_FILE_DB ".backup $BACKUP_DIR/sqlite3.aldowsc.backup"

# Mongo backup.
# mongodump --db zunka -u admin --authenticationDatabase admin --gzip --archive=../dump/db-$(date +%Y-%h-%d@%T).gz    # Tar err if this name format.
echo Creating mongodb backup...
printf "\nMongo db admin password:\n"
mongodump --db zunka -u admin --authenticationDatabase admin --gzip --archive=$BACKUP_DIR/mongodb.gz

# Redis backup.
echo Creating redis backup...
redis-cli save
printf "\nroot password:\n"
sudo cp /var/lib/redis/dump.rdb ../dump/$BACKUP_DIR/redis.rdb

# Backup images.
# tar cvzf ../dump/img-$(date +%Y-%h-%d@%T).tar.gz ../dist/img/ ../dist/banner/   # Tar err if this name format.
# tar cvzf ../dump/img-$(date +%Y-%h-%d).tar.gz ../dist/img/ ../dist/banner/
# tar cvzf ../dump/$(date +%Y-%h-%d)-img.tar.gz ../dist/img/ ../dist/banner/
echo Creating images backup...
tar cvzf $BACKUP_DIR/img.tar.gz $ZUNKA_SITE_PATH/dist/img/ $ZUNKA_SITE_PATH/dist/banner/

echo Finished
