#!/usr/bin/env bash

# Must run in the current shell enviromnent.
[[ $0 != -bash ]] && echo Must be executed in this way: . $BASH_SOURCE && exit 1

# Must be defined.
[[ -z $PP_CLIENT_ID ]] && echo PP_CLIENT_ID not defined && exit 1
[[ -z $PP_SECRET ]] && echo PP_SECRET not defined && exit 1

# Not remove new lines.
IFS=

# RES=`l`
# RES2=`grep get <<< $RES`

# RES=$(curl google.com)

# curl google.com > res.json
# RES=$(grep HREF "res.json")

RES=$(curl -v https://api.sandbox.paypal.com/v1/oauth2/token \
   -H "Accept: application/json" \
   -H "Accept-Language: en_US" \
   -u "$PP_CLIENT_ID:$PP_SECRET" \
   -d "grant_type=client_credentials")

PP_TOKEN_TYPE=`echo $RES | jq -r .token_type`
PP_ACCESS_TOKEN=`echo $RES | jq -r .access_token`
PP_APP_ID=`echo $RES | jq -r .app_id`
PP_EXPIRES_IN=`echo $RES | jq -r .expires_in`
declare -p | grep PP__

# curl -v https://api.sandbox.paypal.com/v1/oauth2/token \
   # -H "Accept: application/json" \
   # -H "Accept-Language: en_US" \
   # -u "client_id:secret" \
   # -d "grant_type=client_credentials"