#!/usr/bin/env bash

cd $(dirname "$0")
printf "\n\n\n\n*** starting update - %s ***\n" "$(date)"
./update-systems.sh
./restart-updated-systems.sh
