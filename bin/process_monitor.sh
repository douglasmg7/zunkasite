#!/usr/bin/env bash

# Check environment variable.
[[ -z "$ZUNKAPATH" ]] && printf "[start-production-script] [error] ZUNKAPATH enviorment not defined.\n" >&2 && exit 1 
printf "%s [PM] Starting process monitor" "$(date)" | tee -a $ZUNKAPATH/log/process_monitor.log

# # Must run in the current shell enviromnent.
# [[ $0 != -bash ]] && echo Usage: . $BASH_SOURCE && exit 1

# Check environment variable.
[[ -z "$GS" ]] && printf "[start-production-script] [error] GS enviorment not defined.\n" >&2 && exit 1 

# Start services.
[[ `systemctl status mongodb | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start mongodb
[[ `systemctl status redis | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start redis
[[ `systemctl status nginx | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start nginx
sleep .1

while true
do
    echo [PM] Checking processes ...


    # printf "\n:: Starting update - %s\n" "$(date)" | tee -a $ZUNKAPATH/log/update.log

    # $ZUNKA_SITE_PATH/bin/system/update-zunkasite.sh | tee -a $ZUNKAPATH/log/update.log
    # $ZUNKA_SITE_PATH/bin/system/update-services.sh | tee -a $ZUNKAPATH/log/update.log
    # . $ZUNKA_SITE_PATH/bin/system/restart-updated-systems.sh


    # freightsrv
    if [[ -z $(pgrep freightsrv) ]]; then
        echo starting freightsrv
        RUN_MODE=production freightsrv &
        sleep .1
    fi

    # # zunkasrv
    # if [[ -z $(pgrep zunkasrv) ]]; then
        # echo starting zunkasrv
        # cd $GS/zunkasrv
        # RUN_MODE=production zunkasrv &
        # cd - > /dev/null
        # sleep .1
    # fi

    # # zunkasite
    # if [[ -z $(pgrep www) ]]; then
        # echo starting zunkasite
        # cd $GS/zunkasite
        # NODE_ENV=production DB=production $GS/zunkasite/bin/www &
        # cd - > /dev/null
        # sleep .1
    # fi

    # # zoomproducts
    # if [[ -z $(pgrep www) ]]; then
        # echo starting zoomproducts
        # RUN_MODE=production zoomproducts &
        # sleep .1
    # fi

    sleep 5
done

