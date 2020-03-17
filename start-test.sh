#!/usr/bin/env bash

# Go to script dir.
cd $(dirname "$0") 

[[ `systemctl status mongodb | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start mongodb
[[ `systemctl status redis | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start redis
[[ `systemctl status nginx | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start nginx
# NODE_ENV=development ./node_modules/mocha/bin/mocha -R spec test/spec.js -t 2000
NODE_ENV=test ./node_modules/mocha/bin/mocha -R spec test/spec.js -t 2000
