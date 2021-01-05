#!/usr/bin/env bash

# Must run in the current shell enviromnent.
[[ $0 != -bash ]] && echo Usage: . $BASH_SOURCE && exit 1

[[ -z $ZUNKAPATH ]] && printf "[updat-script] [error] ZUNKAPATH enviorment not defined.\n" >&2 && exit 1 
[[ -z $ZUNKA_SITE_PATH ]] && printf "[updat-script] [error] ZUNKA_SITE_PATH enviorment not defined.\n" >&2 && exit 1 

printf "\n:: Starting update - %s\n" "$(date)" | tee -a $ZUNKAPATH/log/update.log

touch $ZUNKAPATH/updating-system
$ZUNKA_SITE_PATH/bin/system/update-zunkasite.sh | tee -a $ZUNKAPATH/log/update.log
$ZUNKA_SITE_PATH/bin/system/update-services.sh | tee -a $ZUNKAPATH/log/update.log
. $ZUNKA_SITE_PATH/bin/system/restart-updated-systems.sh
rm $ZUNKAPATH/updating-system
