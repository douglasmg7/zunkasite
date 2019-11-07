#!/usr/bin/env bash

[[ -z $ZUNKAPATH ]] && printf "error: ZUNKAPATH enviorment not defined.\n" >&2 && exit 1 
[[ -z $ZUNKA_SITE_PATH ]] && printf "error: ZUNKA_SITE_PATH enviorment not defined.\n" >&2 && exit 1 

cd $ZUNKA_SITE_PATH

# Restart all.
if [[ -f $ZUNKAPATH/restart-zunka-srv ]] && [[ -f $ZUNKAPATH/restart-zunka-site ]]; then
    echo :: Restarting zunka site...
    echo :: Restarting zunka srv...
    pm2 restart ecosystem.config.js --env production
    rm $ZUNKAPATH/restart-zunka-srv
    rm $ZUNKAPATH/restart-zunka-site
fi
# Restart zunka-site.
if [[ -f $ZUNKAPATH/restart-zunka-site ]];then
    echo :: Restarting zunka site...
    pm2 restart ecosystem.config.js --only zunka_site --env production
    rm $ZUNKAPATH/restart-zunka-site
fi
# Restart zunka-srv.
if [[ -f $ZUNKAPATH/restart-zunka-srv ]];then
    echo :: Restarting zunka srv...
    pm2 restart ecosystem.config.js --only zunka_srv --env production
    rm $ZUNKAPATH/restart-zunka-srv
fi
