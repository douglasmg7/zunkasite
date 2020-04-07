#!/usr/bin/env bash

# Must run in the current shell enviromnent.
[[ $0 != -bash ]] && echo Usage: . $BASH_SOURCE && exit 1

# Check environment variable.
[[ -z "$GS" ]] && printf "[script-start-production] [error]: GS enviorment not defined.\n" >&2 && exit 1 

# Start services.
[[ `systemctl status mongodb | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start mongodb
[[ `systemctl status redis | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start redis
[[ `systemctl status nginx | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start nginx
sleep .1

# Start freight server.
freightsrv &
sleep .1

# Start zunkasrv server.
cd $GS/zunkasrv
zunkasrv &
sleep .1

# Start zunka site.
NODE_ENV=development $GS/zunkasite/bin/www &
sleep .1

# Start zoomproducts.
# zoomproducts &
# sleep .1

cd - > /dev/null
