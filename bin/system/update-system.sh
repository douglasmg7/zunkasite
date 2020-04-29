#!/usr/bin/env bash
[[ -z $ZUNKA_SITE_PATH ]] && printf "error: ZUNKA_SITE_PATH enviorment not defined.\n" >&2 && exit 1 

printf "\n\n\n\nStarting update - %s \n" "$(date)"
ls -la  $ZUNKA_SITE_PATH/bin/system/_update-zunkasite.sh

exit
. $ZUNKA_SITE_PATH/bin/system/_update-zunkasite.sh
. $ZUNKA_SITE_PATH/bin/system/_update-golang-services.sh
. $ZUNKA_SITE_PATH/bin/system/_restart-updated-systems.sh

# ./_update-zunkasite.sh
# ./_update-golang-services.sh
# . ./_restart-updated-systems.sh
