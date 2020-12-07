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

# ALLNATIONS_DB not defined.
if [ -z "$ALLNATIONS_DB" ]; then
	printf "error: ALLNATIONS_DB not defined.\n" >&2
	exit 1 
fi

# ZUNKA_SITE_PATH not defined.
if [ -z "$ZUNKA_SITE_PATH" ]; then
	printf "error: ZUNKA_SITE_PATH not defined.\n" >&2
	exit 1 
fi

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

# Freight db.
FREIGHT_FILE_DB=$ZUNKAPATH/db/$ZUNKA_FREIGHT_DB
FREIGHT_FILE_DB_OLD=$ZUNKAPATH/db/freight-$(date +%Y_%m_%d).db
FREIGHT_DB_BACKUP=$BACKUP_DIR/sqlite3.freight.backup

# Zunkasrv db.
ZUNKASRV_FILE_DB=$ZUNKAPATH/db/$ZUNKA_SRV_DB
ZUNKASRV_FILE_DB_OLD=$ZUNKAPATH/db/zunkasrv-$(date +%Y_%m_%d).db
ZUNKASRV_DB_BACKUP=$BACKUP_DIR/sqlite3.zunkasrv.backup

# Aldowsc db.
ALDOWSC_FILE_DB=$ZUNKAPATH/db/$ZUNKA_ALDOWSC_DB
ALDOWSC_FILE_DB_OLD=$ZUNKAPATH/db/aldowsc-$(date +%Y_%m_%d).db
ALDOWSC_DB_BACKUP=$BACKUP_DIR/sqlite3.aldowsc.backup

# Allnations db.
ALLNATIONS_FILE_DB=$ALLNATIONS_DB
ALLNATIONS_FILE_DB_OLD=$ZUNKAPATH/db/allnations-$(date +%Y_%m_%d).db
ALLNATIONS_DB_BACKUP=$BACKUP_DIR/sqlite3.allnations.backup

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
while true; do
    echo
    read -p "Import freight from $FREIGHT_DB_BACKUP to $FREIGHT_FILE_DB? (y/n):" ANSWER
    if [[ $ANSWER == y ]]; then
        echo "Importing freight db..."
        mv $FREIGHT_FILE_DB $FREIGHT_FILE_DB_OLD
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
while true; do
    echo
    read -p "Import zunkasrv from $ZUNKASRV_DB_BACKUP to $ZUNKASRV_FILE_DB? (y/n):" ANSWER
    if [[ $ANSWER == y ]]; then
        echo "Importing zunkasrv db..."
        mv $ZUNKASRV_FILE_DB $ZUNKASRV_FILE_DB_OLD
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
while true; do
    echo
    read -p "Import aldowsc from $ALDOWSC_DB_BACKUP to $ALDOWSC_FILE_DB? (y/n):" ANSWER
    if [[ $ANSWER == y ]]; then
        echo "Importing aldowsc db..."
        mv $ALDOWSC_FILE_DB $ALDOWSC_FILE_DB_OLD
        sqlite3 $ALDOWSC_FILE_DB ".restore $ALDOWSC_DB_BACKUP"
        break
    elif [[ $ANSWER == n ]]; then
        echo "Aldowsc db will not be imported"
        break
    else
        echo "Invalid option: $ANSWER"
    fi
done

# Allnations sqlite3 db.
while true; do
    echo
    read -p "Import allnations from $ALLNATIONS_DB_BACKUP to $ALLNATIONS_FILE_DB? (y/n):" ANSWER
    if [[ $ANSWER == y ]]; then
        echo "Importing allnations db..."
        mv $ALLNATIONS_FILE_DB $ALLNATIONS_FILE_DB_OLD
        sqlite3 $ALLNATIONS_FILE_DB ".restore $ALLNATIONS_DB_BACKUP"
        break
    elif [[ $ANSWER == n ]]; then
        echo "Allanations db will not be imported"
        break
    else
        echo "Invalid option: $ANSWER"
    fi
done

# Import mongodb.
MONGO_DB_BACKUP=$BACKUP_DIR/mongodb.gz
while true; do
    echo
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
    echo
    read -p "Import redis db? (y/n):" ANSWER
    if [[ $ANSWER == y ]]; then
        echo "Importing redis db..."
        printf "\nroot password:\n"
        sudo systemctl stop redis
        sudo mv /var/lib/redis/dump.rdb /var/lib/redis/dump-$(date +%Y-%m-%d).rdb.old
        sudo cp -p $REDIS_DB_BACKUP /var/lib/redis/dump.rdb
        sudo chown redis:redis /var/lib/redis/dump.rdb
        sudo chmod 660 /var/lib/redis/dump.rdb
        sudo systemctl start redis
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
    echo
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

echo
echo Import finished
