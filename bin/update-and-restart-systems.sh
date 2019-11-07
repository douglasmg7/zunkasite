#!/usr/bin/env bash

cd $(dirname "$0")
./update-systems.sh
./restart-updated-systems.sh
