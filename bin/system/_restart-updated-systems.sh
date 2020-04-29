#!/usr/bin/env bash

[[ -z $ZUNKAPATH ]] && printf "error: ZUNKAPATH enviorment not defined.\n" >&2 && exit 1 
[[ -z $ZUNKA_SITE_PATH ]] && printf "error: ZUNKA_SITE_PATH enviorment not defined.\n" >&2 && exit 1 

cd $ZUNKA_SITE_PATH/bin

# Restart freightsrv.
if [[ -f $ZUNKAPATH/restart-freightsrv ]];then
    echo :: Restarting freightsrv...
    # Stop freight server.
    pkill freightsrv
    # Start freight server.
    RUN_MODE=production freightsrv &
    rm $ZUNKAPATH/restart-freightsrv
    sleep .1
fi

# Restart zunkasite.
if [[ -f $ZUNKAPATH/restart-zunkasite ]];then
    echo :: Restarting zunkasite...
    # Stop zunkasite.
    pkill -f www
    # Start zunka site.
    NODE_ENV=production DB=production $GS/zunkasite/bin/www &
    rm $ZUNKAPATH/restart-zunkasite
    sleep .1
fi

# Restart zunkasrv.
if [[ -f $ZUNKAPATH/restart-zunkasrv ]];then
    echo :: Restarting zunkasrv...
    # Stop zunkasrv.
    pkill zunkasrv
    # Start zunkasrv server.
    cd $GS/zunkasrv
    RUN_MODE=production zunkasrv &
    rm $ZUNKAPATH/restart-zunkasrv
    cd - > /dev/null
    sleep .1
fi

#Restart zoomproducts.
if [[ -f $ZUNKAPATH/restart-zoomproducts ]];then
    echo :: Restarting zoomproducts...
    # Stop zoomproducts.
    pkill zoomproducts
    # Start zoomproducts.
    # RUN_MODE=production zoomproducts &
    zoomproducts &
    rm $ZUNKAPATH/restart-zoomproducts
    sleep .1
fi

# Reload nginx.
if [[ -f $ZUNKAPATH/reload-nginx ]];then
    echo :: Reloading nginx...
    sudo systemctl reload nginx
    rm $ZUNKAPATH/reload-nginx
fi
