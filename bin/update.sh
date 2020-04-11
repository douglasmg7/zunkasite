#!/usr/bin/env bash
[[ -z $ZUNKAPATH ]] && printf "error: ZUNKAPATH enviorment not defined.\n" >&2 && exit 1 
[[ -z $ZUNKA_SITE_PATH ]] && printf "error: ZUNKA_SITE_PATH enviorment not defined.\n" >&2 && exit 1 

cd $ZUNKA_SITE_PATH/bin
. ./system/update-system.sh | tee -a $ZUNKAPATH/log/update.log
