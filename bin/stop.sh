#!/usr/bin/env bash

# Stop zunkasrv.
pkill zunkasrv

# Stop zunkasite.
pkill -f www

# Stop freight server.
pkill freightsrv

# Stop zoomproducts.
pkill zoomproducts
