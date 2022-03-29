#!/usr/bin/env bash
# printf "%s [PM] Stopping process\n" "$(date +"%Y/%m/%d %T.%6N")" | tee -a $ZUNKAPATH/log/process_monitor.log

# Check environment variable.
if [[ -z "$ZUNKAPATH" ]]; then 
    printf "%s [PM] [error] ZUNKAPATH enviorment not defined\n" "$(date +"%Y/%m/%d %T.%6N")" | tee -a $ZUNKAPATH/log/process_monitor.log
    exit 1
fi

if [[ -z "$GS" ]]; then 
    printf "%s [PM] [error] GS enviorment not defined\n" "$(date +"%Y/%m/%d %T.%6N")" | tee -a $ZUNKAPATH/log/process_monitor.log
    exit 1 
fi

stop_process () {
    # No args.
    if [[ $1 ]] 
    then
        process=$1
    else
        echo "error: stop_process function called without path argument." && exit 1 
    fi

    # Two args
    if [[ $2 ]] 
    then
        process="$1 $2"
    fi

    # echo $process

    # Stop process.
    while [[ $(pgrep $process) ]]
    do 
        printf "%s [PM] Stopping $process...\n" "$(date +"%Y/%m/%d %T.%6N")" | tee -a $ZUNKAPATH/log/process_monitor.log
        pkill $process
        sleep .5
    done
    printf "%s [PM] $process stopped\n" "$(date +"%Y/%m/%d %T.%6N")" | tee -a $ZUNKAPATH/log/process_monitor.log
}

stop_process -f www     # zunkasite
stop_process zunkasrv
stop_process zoomproducts
stop_process freightsrv
stop_process meli_timer
