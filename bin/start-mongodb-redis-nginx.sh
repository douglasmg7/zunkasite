#!/usr/bin/env bash

# Start dockerizeds.
$ZUNKA_DOCKER_SCRIPTS/start-mongo.sh
$ZUNKA_DOCKER_SCRIPTS/start-redis.sh


# [[ `systemctl status mongodb | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start mongodb
# [[ `systemctl status redis | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start redis
[[ `systemctl status nginx | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start nginx

exit 0
