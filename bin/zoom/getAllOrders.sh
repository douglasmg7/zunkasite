#!/usr/bin/env bash

RESULT=$(curl -u zoomteste_zunka:H2VA79Ug4fjFsJb -X GET http://merchant.zoom.com.br/api/merchant/orders/ -H "Content-Type: application/json")

echo $RESULT | jq -r . 