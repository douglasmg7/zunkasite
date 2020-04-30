#!/usr/bin/env bash

[[ -z $ZUNKAPATH ]] && printf "error: ZUNKAPATH enviorment not defined.\n" >&2 && exit 1 
[[ -z $ZUNKA_SITE_PATH ]] && printf "error: ZUNKA_SITE_PATH enviorment not defined.\n" >&2 && exit 1 

cd $ZUNKA_SITE_PATH/bin

printf "\n:: Checking process to be restarted...\n"
jobs -l

###########  Stop process ##########
# freightsrv.
if [[ -f $ZUNKAPATH/restart-freightsrv ]];then
    printf ":: Stopping freightsrv...\n"
    pkill freightsrv
    # sleep 3
fi
#  zunkasite.
if [[ -f $ZUNKAPATH/restart-zunkasite ]];then
    printf ":: Stopping zunkasite...\n"
    pkill -f www
    # sleep 5
fi
# zunkasrv.
if [[ -f $ZUNKAPATH/restart-zunkasrv ]];then
    printf ":: Stopping zunkasrv...\n"
    pkill zunkasrv
    # sleep 3
fi
# zoomproducts.
if [[ -f $ZUNKAPATH/restart-zoomproducts ]];then
    printf ":: Stopping zoomproducts...\n"
    pkill zoomproducts
    # sleep 3
fi

###########  Start process ##########
# freightsrv.
if [[ -f $ZUNKAPATH/restart-freightsrv ]];then
    sleep 4
    printf ":: Starting freightsrv...\n"
    RUN_MODE=production freightsrv &
    # freightsrv &
    rm $ZUNKAPATH/restart-freightsrv
    sleep 3
fi
# zunkasite.
if [[ -f $ZUNKAPATH/restart-zunkasite ]];then
    printf ":: Starting zunkasite...\n"
    NODE_ENV=production DB=production $GS/zunkasite/bin/www &
    # NODE_ENV=development $GS/zunkasite/bin/www &
    rm $ZUNKAPATH/restart-zunkasite
    sleep 5
fi

# zunkasrv.
if [[ -f $ZUNKAPATH/restart-zunkasrv ]];then
    printf ":: Starting zunkasrv...\n"
    cd $GS/zunkasrv
    RUN_MODE=production zunkasrv &
    # zunkasrv &
    rm $ZUNKAPATH/restart-zunkasrv
    cd - > /dev/null
    sleep 3
fi

# zoomproducts.
if [[ -f $ZUNKAPATH/restart-zoomproducts ]];then
    printf ":: Starting zoomproducts...\n"
    # RUN_MODE=production zoomproducts &
    zoomproducts &
    rm $ZUNKAPATH/restart-zoomproducts
    sleep 3
fi

# Reload nginx.
if [[ -f $ZUNKAPATH/reload-nginx ]];then
    printf ":: Reloading nginx...\n"
    sudo systemctl reload nginx
    rm $ZUNKAPATH/reload-nginx
fi

jobs -l
printf ":: Restarting process finished.\n"
