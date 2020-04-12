#!/usr/bin/env bash

# Must run in the current shell enviromnent.
[[ $0 != -bash ]] && echo Usage: . $BASH_SOURCE && exit 1

[[ -z $ZUNKAPATH ]] && printf "[updat-script] [error] ZUNKAPATH enviorment not defined.\n" >&2 && exit 1 
[[ -z $ZUNKA_SITE_PATH ]] && printf "[updat-script] [error] ZUNKA_SITE_PATH enviorment not defined.\n" >&2 && exit 1 

cd $ZUNKA_SITE_PATH/bin
. ./system/update-system.sh | tee -a $ZUNKAPATH/log/update.log
