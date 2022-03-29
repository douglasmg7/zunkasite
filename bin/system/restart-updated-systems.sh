#!/usr/bin/env bash

[[ -z $ZUNKAPATH ]] && printf "error: ZUNKAPATH enviorment not defined.\n" >&2 && exit 1 
[[ -z $ZUNKA_SITE_PATH ]] && printf "error: ZUNKA_SITE_PATH enviorment not defined.\n" >&2 && exit 1 

cd $ZUNKA_SITE_PATH/bin

printf "\n:: Stopping processes to be restarted...\n"

# printf "\n:: Checking process to be restarted...\n"
# jobs -l

###########  Stop process ##########
# freightsrv.
if [[ -f $ZUNKAPATH/restart-freightsrv ]];then
    printf ":: Stopping freightsrv...\n"
    pkill freightsrv
    sleep 3
fi
#  zunkasite.
if [[ -f $ZUNKAPATH/restart-zunkasite ]];then
    printf ":: Stopping zunkasite...\n"
    pkill -f www
    sleep 5
fi
# zunkasrv.
if [[ -f $ZUNKAPATH/restart-zunkasrv ]];then
    printf ":: Stopping zunkasrv...\n"
    pkill zunkasrv
    sleep 3
fi
# zoomproducts.
if [[ -f $ZUNKAPATH/restart-zoomproducts ]];then
    printf ":: Stopping zoomproducts...\n"
    pkill zoomproducts
    sleep 3
fi
# meli_timer.
if [[ -f $ZUNKAPATH/restart-meli_timer ]];then
    printf ":: Stopping meli_timer...\n"
    pkill meli_timer
    sleep 3
fi

###########  Start process ##########
# freightsrv.
# Process monitor will restart the process.
if [[ -f $ZUNKAPATH/restart-freightsrv ]];then
    # sleep 4
    # printf ":: Starting freightsrv...\n"
    # RUN_MODE=production freightsrv &
    rm $ZUNKAPATH/restart-freightsrv
    # sleep 3
fi
# zunkasite.
# Process monitor will restart the process.
if [[ -f $ZUNKAPATH/restart-zunkasite ]];then
    # printf ":: Starting zunkasite...\n"
    # NODE_ENV=production DB=production $GS/zunkasite/bin/www &
    rm $ZUNKAPATH/restart-zunkasite
    # sleep 5
fi

# zunkasrv.
# Process monitor will restart the process.
if [[ -f $ZUNKAPATH/restart-zunkasrv ]];then
    # printf ":: Starting zunkasrv...\n"
    # cd $GS/zunkasrv
    # RUN_MODE=production zunkasrv &
    rm $ZUNKAPATH/restart-zunkasrv
    # cd - > /dev/null
    # sleep 3
fi

# zoomproducts.
# Process monitor will restart the process.
if [[ -f $ZUNKAPATH/restart-zoomproducts ]];then
    # printf ":: Starting zoomproducts...\n"
    # RUN_MODE=production zoomproducts &
    rm $ZUNKAPATH/restart-zoomproducts
    # sleep 3
fi

# meli_timer.
# Process monitor will start the process.
if [[ -f $ZUNKAPATH/restart-meli_timer ]];then
    rm $ZUNKAPATH/restart-meli_timer
fi

# Reload nginx.
if [[ -f $ZUNKAPATH/reload-nginx ]];then
    printf ":: Reloading nginx...\n"
    sudo systemctl reload nginx
    rm $ZUNKAPATH/reload-nginx
fi

# jobs -l
# printf ":: Restarting process finished.\n"
