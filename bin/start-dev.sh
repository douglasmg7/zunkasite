#!/usr/bin/env bash

[[ `systemctl status mongodb | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start mongodb
[[ `systemctl status redis | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start redis
[[ `systemctl status nginx | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start nginx

freightsrv &

cd $GS/zunkasrv
zunkasrv &
cd -

NODE_ENV=development $GS/zunkasite/bin/www &
# exit 0
