#!/usr/bin/env bash

# Stop processes monitor.
pkill -f process_monitor.sh
sleep .5

# Stop zunkasite.
pkill -f www

# Stop zunkasrv.
pkill zunkasrv

# Stop zoomproducts.
pkill zoomproducts

# Stop freight server.
pkill freightsrv
