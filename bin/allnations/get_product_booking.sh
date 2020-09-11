#!/usr/bin/env bash

if [ -z "$1" ]; then
    echo "Usage: $0 product_code"
    exit
fi

./get_product_booking_retrive.js $1 | ./get_product_booking_process.js
