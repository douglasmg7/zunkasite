#!/usr/bin/env bash

if [ -z "$1" ]
  then
    echo "Usage: $0 order-id"
    exit
fi


read -r URL TYPE TOKEN <<< $(./token.sh)
RESULT=$(curl -s ${URL}payments/payment/$1 \
  -H "Content-Type: application/json" \
  -H "Authorization: $TYPE $TOKEN")

# RESULT="curl -s -X GET ${URL}payments/payment/$1 \
  # -H \"Content-Type: application/json\" \
  # -H \"Authorization: $TYPE $TOKEN\""

# echo $RESULT
echo $RESULT | jq -r '.transactions | .[0] | .related_resources | .[0] | .sale | .state'

# .transaction[0].selated_resources[0].sale.state