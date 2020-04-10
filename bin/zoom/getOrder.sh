#!/usr/bin/env bash

RESULT=$(curl -u zoomteste_zunka:H2VA79Ug4fjFsJb -X GET 'http://merchant.zoom.com.br/api/merchant/order/31559839856' -H "Content-Type: application/json")
# curl --location --request GET 'http://merchant.zoom.com.br/api/merchant/order/<integer>'

echo $RESULT | jq -r . 