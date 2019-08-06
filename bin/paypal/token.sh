#!/usr/bin/env bash

# $1 = production, for production mode.
read -r URL CLIENT_ID SECRET <<< $(./paypal-config.sh $1)

RES=$(curl -s ${URL}oauth2/token \
   -H "Accept: application/json" \
   -H "Accept-Language: en_US" \
   -u "$CLIENT_ID:$SECRET" \
   -d "grant_type=client_credentials")

TOKEN_TYPE=`echo $RES | jq -r .token_type`
ACCESS_TOKEN=`echo $RES | jq -r .access_token`
# PP_APP_ID=`echo $RES | jq -r .app_id`
# PP_EXPIRES_IN=`echo $RES | jq -r .expires_in`
# declare -p | grep PP__
echo $URL $TOKEN_TYPE $ACCESS_TOKEN