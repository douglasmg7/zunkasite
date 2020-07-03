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

while true; do
    read -p "Import backup from which date? [ENTER] for $(date +%Y-%m-%d) or yyyy-mm-dd to custom date: " ANSWER
    if [[ $ANSWER =~ [0-9]{4}-[0-9]{2}-[0-9]{2} ]]; then
        BACKUP_DIR=$ZUNKA_SITE_PATH/dump/$ANSWER
        break
    elif [[ -z $ANSWER ]]; then
        BACKUP_DIR=$ZUNKA_SITE_PATH/dump/$(date +%Y-%m-%d)
        break
    else
        echo "Invalid date: $ANSWER"
    fi
done

# Warn freight db exist.
if [[ -f $FREIGHT_FILE_DB ]]; then
    printf "WARN: $FREIGHT_FILE_DB exist.\n"
fi

# Warn zunkasrv db exist.
if [[ -f $ZUNKASRV_FILE_DB ]]; then
    printf "WARN: $ZUNKASRV_FILE_DB exist.\n"
fi

# Warn aldowsc db exist.
if [[ -f $ALDOWSC_FILE_DB ]]; then
    printf "WARN: $ALDOWSC_FILE_DB exist.\n"
fi

# Freight sqlite3 db.
FREIGHT_DB_BACKUP=$BACKUP_DIR/sqlite3.freight.backup
while true; do
    read -p "Import freight from $FREIGHT_DB_BACKUP to $FREIGHT_FILE_DB? (y/n):" ANSWER
    if [[ $ANSWER == y ]]; then
        echo "Importing freight db..."
        sqlite3 $FREIGHT_FILE_DB ".restore $FREIGHT_DB_BACKUP"
        break
    elif [[ $ANSWER == n ]]; then
        echo "Freight db will not be imported"
        break
    else
        echo "Invalid option: $ANSWER"
    fi
done

# Zunkasrv sqlite3 db.
ZUNKASRV_DB_BACKUP=$BACKUP_DIR/sqlite3.zunkasrv.backup
while true; do
    read -p "Import zunkasrv from $ZUNKASRV_DB_BACKUP to $ZUNKASRV_FILE_DB? (y/n):" ANSWER
    if [[ $ANSWER == y ]]; then
        echo "Importing zunkasrv db..."
        sqlite3 $ZUNKASRV_FILE_DB ".restore $ZUNKASRV_DB_BACKUP"
        break
    elif [[ $ANSWER == n ]]; then
        echo "Zunkasrv db will not be imported"
        break
    else
        echo "Invalid option: $ANSWER"
    fi
done

# Aldowsc sqlite3 db.
ALDOWSC_DB_BACKUP=$BACKUP_DIR/sqlite3.aldowsc.backup
while true; do
    read -p "Import aldowsc from $ALDOWSC_DB_BACKUP to $ALDOWSC_FILE_DB? (y/n):" ANSWER
    if [[ $ANSWER == y ]]; then
        echo "Importing aldowsc db..."
        sqlite3 $ALDOWSC_FILE_DB ".restore $ALDOWSC_DB_BACKUP"
        break
    elif [[ $ANSWER == n ]]; then
        echo "Aldowsc db will not be imported"
        break
    else
        echo "Invalid option: $ANSWER"
    fi
done

# Import mongodb.
MONGO_DB_BACKUP=$BACKUP_DIR/mongodb.gz
while true; do
    read -p "Import mongo db? (y/n):" ANSWER
    if [[ $ANSWER == y ]]; then
        echo "Importing mongo db..."
        printf "\nMongo db admin password:\n"
        mongorestore -u admin --authenticationDatabase admin --nsInclude zunka.* --nsFrom 'zunka.*' --nsTo 'zunka.*' --gzip --archive=$MONGO_DB_BACKUP
        break
    elif [[ $ANSWER == n ]]; then
        echo "Mongo db will not be imported"
        break
    else
        echo "Invalid option: $ANSWER"
    fi
done

# Import redis db.
REDIS_DB_BACKUP=$BACKUP_DIR/redis.rdb
while true; do
    read -p "Import redis db? (y/n):" ANSWER
    if [[ $ANSWER == y ]]; then
        echo "Importing redis db..."
        printf "\nroot password:\n"
        sudo service redis-server stop
        sudo service redis-server status
        sudo mv /var/lib/redis/dump.rdb /var/lib/redis/$(date +%Y-%m-%d).dump.rdb.old
        sudo cp -p $REDIS_DB_BACKUP/var/lib/redis
        sudo chown redis:redis /var/lib/redis/dump.rdb
        sudo chmod 660 /var/lib/redis/dump.rdb
        sudo service redis-server start
        break
    elif [[ $ANSWER == n ]]; then
        echo "Redis db will not be imported"
        break
    else
        echo "Invalid option: $ANSWER"
    fi
done

# Import images.
IMAGES_BACKUP=$BACKUP_DIR/img.tar.gz
while true; do
    read -p "Import images? (y/n):" ANSWER
    if [[ $ANSWER == y ]]; then
        echo Importing images.
        tar zxvf $BACKUP_DIR/img.tar.gz -C $ZUNKA_SITE_PATH
        break
    elif [[ $ANSWER == n ]]; then
        echo "Images will not be imported"
        break
    else
        echo "Invalid option: $ANSWER"
    fi
done

echo Import finished
