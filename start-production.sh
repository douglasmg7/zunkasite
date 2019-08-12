#!/usr/bin/env bash

# Go to script dir.
cd $(dirname "$0") 

[[ `systemctl status mongodb | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start mongodb
[[ `systemctl status redis | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start redis
npm run build
npm start
