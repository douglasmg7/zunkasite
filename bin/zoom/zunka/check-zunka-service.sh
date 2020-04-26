#!/usr/bin/env bash

[[ -z $ZUNKA_SITE_PATH ]] && printf "[error] ZUNKA_SITE_PATH enviorment not defined.\n" >&2 && exit 1 

read -r HOST USER PASS <<< $($ZUNKA_SITE_PATH/bin/zoom/zunka/zunka-auth.sh)

CMD="curl -u $USER:$PASS -X GET $HOST/hello"
echo $CMD

$CMD
echo