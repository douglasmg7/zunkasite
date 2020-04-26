#!/usr/bin/env bash

if [ -z "$1" ]
  then
    echo "Usage: $0 order-id"
    exit
fi

[[ -z $ZUNKA_SITE_PATH ]] && printf "[error] ZUNKA_SITE_PATH enviorment not defined.\n" >&2 && exit 1 

read -r HOST USER PASS <<< $($ZUNKA_SITE_PATH/bin/zoom/zoom-auth.sh)

RESULT=$(curl -u $USER:$PASS -X GET $HOST/order/$1 -H "Content-Type: application/json")

echo $RESULT | jq -r . 