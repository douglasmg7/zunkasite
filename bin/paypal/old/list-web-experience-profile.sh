#!/usr/bin/env bash

# Must run in the current shell enviromnent.
[[ $0 != -bash ]] && echo Must be executed in this way: . $BASH_SOURCE && exit 1

# Must be defined.
[[ -z $PP_TOKEN_TYPE ]] && echo PP_TOKEN_TYPE not defined && return 1
[[ -z $PP_ACCESS_TOKEN ]] && echo PP_ACCESS_TOKEN not defined && return 1

# Not remove new lines.
IFS=

PP_WEB_EXP_PROFILES=$(curl -v -X GET https://api.sandbox.paypal.com/v1/payment-experience/web-profiles/ \
  -H "Content-Type: application/json" \
  -H "Authorization: $PP_TOKEN_TYPE $PP_ACCESS_TOKEN")

echo $PP_WEB_EXP_PROFILES | jq -r . 