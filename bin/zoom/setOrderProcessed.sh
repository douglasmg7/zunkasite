#!/usr/bin/env bash

RESULT=$(curl -u zoomteste_zunka:H2VA79Ug4fjFsJb -X PUT 'https://merchant.zoom.com.br/api/merchant/order/31559839856/processed')

echo $RESULT