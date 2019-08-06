#!/usr/bin/env bash

read -r URL TYPE TOKEN <<< $(./token.sh $1)

WEB_EXP_PROFILES=$(curl -s -X GET ${URL}payment-experience/web-profiles/ \
  -H "Content-Type: application/json" \
  -H "Authorization: $TYPE $TOKEN")

echo $WEB_EXP_PROFILES | jq -r . 