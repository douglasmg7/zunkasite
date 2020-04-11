#!/usr/bin/env bash

cd $(dirname "$0")
printf "\n\n\n\nStarting update - %s \n" "$(date)"
./_update-zunkasite.sh
./_update-golang-services.sh
. ./_restart-updated-systems.sh
