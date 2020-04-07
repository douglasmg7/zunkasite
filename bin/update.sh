#!/usr/bin/env bash

cd $(dirname "$0")
./system/update-system.sh | tee -a $ZUNKAPATH/log/update.log",
