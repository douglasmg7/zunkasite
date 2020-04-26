#!/usr/bin/env bash

[[ -z $ZUNKA_SITE_PATH ]] && printf "[error] ZUNKA_SITE_PATH enviorment not defined.\n" >&2 && exit 1 

read -r HOST USER PASS <<< $($ZUNKA_SITE_PATH/bin/zoom/zoom-auth.sh)

RESULT=$(curl -u $USER:$PASS -X GET $HOST/orders/ -H "Content-Type: application/json")

echo $RESULT | jq -r . 