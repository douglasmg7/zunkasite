#!/usr/bin/env bash

# Must run in the current shell enviromnent.
[[ $0 != -bash ]] && echo Must be executed in this way: . $BASH_SOURCE && exit 1

# Must be defined.
[[ -z $PP_TOKEN_TYPE ]] && echo PP_TOKEN_TYPE not defined && exit 1
[[ -z $PP_ACCESS_TOKEN ]] && echo PP_ACCESS_TOKEN not defined && exit 1

# Not remove new lines.
IFS=


# echo "Authorization: $PP_TOKEN_TYPE $PP_ACCESS_TOKEN"

PP_WEB_EXP_PROFILE=$(curl -v -X \
  POST https://api.sandbox.paypal.com/v1/payment-experience/web-profiles/ \
  -H "Content-Type: application/json" \
  -H "Authorization: $PP_TOKEN_TYPE $PP_ACCESS_TOKEN" \
  -d '{
  "name": "zunka_profile",
  "presentation":
  {
	"logo_image": "https://www.zunka.com.br/logo.png"
  },
  "input_fields":
  {
	"no_shipping": 1,
	"address_override": 1
  },
  "flow_config":
  {
	"landing_page_type": "billing",
	"bank_txn_pending_url": "https://www.paypal.com"
  }
}')

PP_PROFILE_ID=`echo $PP_WEB_EXP_PROFILE | jq -r .id`