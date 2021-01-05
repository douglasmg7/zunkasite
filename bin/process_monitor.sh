#!/usr/bin/env bash

# Must run in the current shell enviromnent.
# [[ $0 != -bash ]] && echo Usage: . $BASH_SOURCE && exit 1

printf "%s [PM] Starting process monitor\n" "$(date +"%Y/%m/%d %T.%6N")" | tee -a $ZUNKAPATH/log/process_monitor.log

# Check environment variable.
if [[ -z "$ZUNKAPATH" ]]; then 
    printf "%s [PM] [error] ZUNKAPATH enviorment not defined\n" "$(date +"%Y/%m/%d %T.%6N")" | tee -a $ZUNKAPATH/log/process_monitor.log
    exit 1
fi

if [[ -z "$GS" ]]; then 
    printf "%s [PM] [error] GS enviorment not defined\n" "$(date +"%Y/%m/%d %T.%6N")" | tee -a $ZUNKAPATH/log/process_monitor.log
    exit 1 
fi

# Start services.
[[ `systemctl status mongodb | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start mongodb
[[ `systemctl status redis | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start redis
[[ `systemctl status nginx | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start nginx
sleep .1

while true
do
    # Updating system.
    while [[ -f $ZUNKAPATH/updating-system ]]
    do
        printf "%s [PM] Waiting system update finish\n" "$(date +"%Y/%m/%d %T.%6N")" | tee -a $ZUNKAPATH/log/process_monitor.log
        sleep 5
    done

    ALL_PROCESS_RUNNING=true

    # freightsrv
    if [[ -z $(pgrep freightsrv) ]]; then
        ALL_PROCESS_RUNNING=false
        printf "%s [PM] Starting freightsrv\n" "$(date +"%Y/%m/%d %T.%6N")" | tee -a $ZUNKAPATH/log/process_monitor.log
        RUN_MODE=production freightsrv &
        sleep 3
    fi

    # zunkasrv
    if [[ -z $(pgrep zunkasrv) ]]; then
        ALL_PROCESS_RUNNING=false
        printf "%s [PM] Starting zunkasrv\n" "$(date +"%Y/%m/%d %T.%6N")" | tee -a $ZUNKAPATH/log/process_monitor.log
        cd $GS/zunkasrv
        RUN_MODE=production zunkasrv &
        cd - > /dev/null
        sleep 3
    fi

    # zunkasite
    if [[ -z $(pgrep -f www) ]]; then
        ALL_PROCESS_RUNNING=false
        printf "%s [PM] Starting zunkasite\n" "$(date +"%Y/%m/%d %T.%6N")" | tee -a $ZUNKAPATH/log/process_monitor.log
        cd $GS/zunkasite
        NODE_ENV=production DB=production $GS/zunkasite/bin/www &
        # NODE_ENV=development DB=production $GS/zunkasite/bin/www &
        cd - > /dev/null
        sleep 5
    fi

    # zoomproducts
    if [[ -z $(pgrep zoomproducts) ]]; then
        ALL_PROCESS_RUNNING=false
        printf "%s [PM] Starting zoomproducts\n" "$(date +"%Y/%m/%d %T.%6N")" | tee -a $ZUNKAPATH/log/process_monitor.log
        RUN_MODE=production zoomproducts &
        sleep 3
    fi

    if [[ $ALL_PROCESS_RUNNING == true ]]; then
        printf "%s [PM] All processes running\n" "$(date +"%Y/%m/%d %T.%6N")" | tee -a $ZUNKAPATH/log/process_monitor.log
    fi

    sleep 30
done

