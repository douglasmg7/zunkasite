#!/usr/bin/env bash

# Must run in the current shell enviromnent.
# [[ $0 != -bash ]] && echo Usage: . $BASH_SOURCE && exit 1

# Check environment variable.
[[ -z "$GS" ]] && printf "[script-start-production] [error]: GS enviorment not defined.\n" >&2 && exit 1 

# Start docker services.
[[ `systemctl status docker | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start docker
sleep .5

# Create or start mongo container.
if [[ -z $(docker ps -a | grep zunka_mongo) ]]
# Create and implicit start container.
then
    echo 'Creating and starting zunka_mongo container:'
    docker run -d --name zunka_mongo -v zunka_mongo_data:/data/db -p 27017:27017 mongo:3.6.3
    echo '#################### No data, import backup to new created mongo docker ###########################!'
# Start zunka_mongo container.
else
    echo 'Starting zunka_mongo container:'
    docker start zunka_mongo
fi

echo "To access mongo:"
echo "  docker exec -it zunka_mongo bash"
echo "  mongo zunka"



# Create or start redis container.
if [[ -z $(docker ps -a | grep redis_zunka) ]]
# Create and implicit start container.
then
    echo 'Creating and starting redis_zunka container:'
    # docker run -d --name zunka_mongo -v data:/data/db -p 27017:27017 mongo:3.6.3
    docker run -d --name zunka_redis redis:4.0.9 redis-server --save 60 1 --loglevel warning
    # docker run -d --name redis_zunka -v data_redis:/data redis:4.0.9 redis-server --save 60 1 --loglevel warning
    # docker run -d --name redis_zunka redis redis-server --save 60 1 --loglevel warning
    # docker run -d --name redis_zunka -v /docker/host/dir:/data redis redis-server --save 60 1 --loglevel warning

# Start zunka_redis container.
else
    echo 'Starting redis_zunka container:'
    docker start zunka_redis
fi

echo "To access mongo:"
echo "  docker exec -it zunka_redis sh"


[[ `systemctl status nginx | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start nginx
sleep .1

# # Start freight server.
# freightsrv &
# sleep .1

# # Start zunkasrv server.
# cd $GS/zunkasrv
# zunkasrv &
# cd - > /dev/null
# sleep .1

# # Start zunka site.
# cd $GS/zunkasite
# NODE_ENV=development $GS/zunkasite/bin/www &
# cd - > /dev/null
# sleep .1

# Start zoomproducts.
# zoomproducts &
# sleep .1
