#!/usr/bin/env bash

# ZUNKA_SITE_PATH not defined.
if [ -z "$ZUNKA_SITE_PATH" ]; then
	printf "error: ZUNKA_SITE_PATH not defined.\n" >&2
	exit 1 
fi

while true; do
    read -p "Which date to use to download backup? [ENTER] for $(date +%Y-%m-%d) or yyyy-mm-dd to custom date: " ANSWER
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

scp -r douglasmg7@vps10092.publiccloud.com.br:$BACKUP_DIR $BACKUP_DIR
