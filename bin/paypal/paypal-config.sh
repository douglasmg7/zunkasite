#!/usr/bin/env bash

# Go to script dir.
cd $(dirname "$0") 

# Not remove new lines.
IFS=

# Run mode.
[[ $1 == production ]] && MODE="production:\s{" || MODE="sandbox:\s{"

# Production.
CLIENT_ID=$(grep $MODE ../../config/s.js -A 10 | grep ppClientId | head -1 | cut -d " " -f2 | sed 's/"//;s/",//')
SECRET=$(grep $MODE ../../config/s.js -A 10 | grep ppSecret | head -1 | cut -d " " -f2 | sed 's/"//;s/",//')
URL=$(grep $MODE ../../config/s.js -A 10 | grep ppUrl | head -1 | cut -d " " -f2 | sed 's/"//g;s/,//')
echo $URL $CLIENT_ID $SECRET