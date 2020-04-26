#!/usr/bin/env bash

[[ -z $ZUNKA_SITE_PATH ]] && printf "[error] ZUNKA_SITE_PATH enviorment not defined.\n" >&2 && exit 1 

# Development mode.
TOKEN_HOST=zoomInternalAuth.development.host
TOKEN_USER=zoomInternalAuth.development.user
TOKEN_PASS=zoomInternalAuth.development.password

# Production mode.
if [[ $RUN_MODE == production ]]; then
    TOKEN_HOST=zoomInternalAuth.production.host
    TOKEN_USER=zoomInternalAuth.production.user
    TOKEN_PASS=zoomInternalAuth.production.password
fi

HOST=`grep "^\s*$TOKEN_HOST" $ZUNKA_SITE_PATH/config/s.js | cut -d " " -f3 | sed 's/"//g' | sed 's/;$//'`
USER=`grep "^\s*$TOKEN_USER" $ZUNKA_SITE_PATH/config/s.js | cut -d " " -f3 | sed 's/"//g' | sed 's/;$//'`
PASS=`grep "^\s*$TOKEN_PASS" $ZUNKA_SITE_PATH/config/s.js | cut -d " " -f3 | sed 's/"//g' | sed 's/;$//'`

echo $HOST $USER $PASS
