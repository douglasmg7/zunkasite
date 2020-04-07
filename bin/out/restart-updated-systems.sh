#!/usr/bin/env bash

[[ -z $ZUNKAPATH ]] && printf "error: ZUNKAPATH enviorment not defined.\n" >&2 && exit 1 
[[ -z $ZUNKA_SITE_PATH ]] && printf "error: ZUNKA_SITE_PATH enviorment not defined.\n" >&2 && exit 1 

cd $ZUNKA_SITE_PATH

# Restart all.
if [[ -f $ZUNKAPATH/restart-zunkasite ]] && [[ -f $ZUNKAPATH/restart-zunkasrv ]] && [[ -f $ZUNKAPATH/restart-freightsrv ]] && [[ -f $ZUNKAPATH/restart-zoomproducts ]]; then
    echo :: Restarting zunkasite, zunkasrv, freightsrv and zoomproducts...
    pm2 restart ecosystem.config.js --env production
    pm2 save
    rm $ZUNKAPATH/restart-zunkasite
    rm $ZUNKAPATH/restart-zunkasrv
    rm $ZUNKAPATH/restart-freightsrv
    rm $ZUNKAPATH/restart-zoomproducts
fi

# Restart zunkasite.
if [[ -f $ZUNKAPATH/restart-zunkasite ]];then
    echo :: Restarting zunkasite...
    pm2 restart ecosystem.config.js --only zunkasite --env production
    pm2 save
    rm $ZUNKAPATH/restart-zunkasite
fi

# Restart zunkasrv.
if [[ -f $ZUNKAPATH/restart-zunkasrv ]];then
    echo :: Restarting zunkasrv...
    pm2 restart ecosystem.config.js --only zunkasrv --env production
    pm2 save
    rm $ZUNKAPATH/restart-zunkasrv
fi

# Restart freightsrv.
if [[ -f $ZUNKAPATH/restart-freightsrv ]];then
    echo :: Restarting freightsrv...
    pm2 restart ecosystem.config.js --only freightsrv --env production
    pm2 save
    rm $ZUNKAPATH/restart-freightsrv
fi

# Restart zoomproducts.
if [[ -f $ZUNKAPATH/restart-zoomproducts ]];then
    echo :: Restarting zoomproducts...
    pm2 restart ecosystem.config.js --only zoomproducts --env production
    pm2 save
    rm $ZUNKAPATH/restart-zoomproducts
fi
