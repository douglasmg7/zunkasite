#!/usr/bin/env bash

if [ -z "$2" ]
  then
    echo "Usage: $0 zoom-order-number order-status"
    exit
fi

[[ -z $ZUNKA_SITE_PATH ]] && printf "[error] ZUNKA_SITE_PATH enviorment not defined.\n" >&2 && exit 1 

read -r HOST USER PASS <<< $($ZUNKA_SITE_PATH/bin/zoom/zunka/zunka-auth.sh)

# CMD="curl -u $USER:$PASS -X POST $HOST/order-status -H \"Content-Type: application/json\" -d '{\"orderNumber\": \"$1\", \"status\": \"$2\"}'"
CMD="curl -u $USER:$PASS -H \"Content-Type: application/json\" -d '{\"orderNumber\": \"$1\", \"status\": \"$2\"}' -X POST $HOST/order-status" 
echo $CMD

eval $CMD
echo