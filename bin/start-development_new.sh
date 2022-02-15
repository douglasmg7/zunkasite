#!/usr/bin/env bash

# Must run in the current shell enviromnent.
# [[ $0 != -bash ]] && echo Usage: . $BASH_SOURCE && exit 1

# Check environment variable.
[[ -z "$GS" ]] && printf "[script-start-production] [error]: GS enviorment not defined.\n" >&2 && exit 1 

# Start docker services.
[[ `systemctl status docker | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start docker
sleep .5

# Create or start mongo container.
if [[ -z $(docker ps -a | grep mongo_zunka) ]]
# Create and implicit start container.
then
    echo 'Creating and starting mongo_zunka container:'
    docker run -d --name mongo_zunka -v data:/data/db -p 27017:27017 mongo:3.6.3
# Start mongo_zunka container.
else
    echo 'Starting mongo_zunka container:'
    docker start mongo_zunka
fi

echo "To access mongo:"
echo "  docker exec -it mongo_zunka bash"
echo "  mongo zunka"

exit



# [[ `systemctl status mongodb | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start mongodb

# [[ `systemctl status redis | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start redis
# [[ `systemctl status nginx | awk '/Active/{print $2}'` == inactive ]] && sudo systemctl start nginx
sleep .1

echo 'Exiting'
exit
echo 'After exiting'

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
