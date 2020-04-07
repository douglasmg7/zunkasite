#! /usr/bin/env bash

if [ -z $1 ]
then
  echo "Usage: $0 archived_filename.gz"
  exit 1
fi

echo "File choosed: $1"
# mongorestore -u admin --authenticationDatabase admin --nsInclude zunka.* --nsFrom 'zunka.*' --nsTo 'zunkaRecovery.*' --gzip --archive=$1
mongorestore -u admin --authenticationDatabase admin --nsInclude zunka.* --nsFrom 'zunka.*' --nsTo 'zunka.*' --gzip --archive=$1

# mongorestore -u admin --authenticationDatabase admin --nsInclude zunka.products --nsFrom 'zunka.*' --nsTo 'zunkaRecovery.*' --gzip --archive=./dump/2018-Sep-14@08:21:22.gz
