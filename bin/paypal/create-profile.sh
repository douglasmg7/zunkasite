#!/usr/bin/env bash

read -r URL TYPE TOKEN <<< $(./token.sh $1)

RES=$(curl -s -X POST ${URL}payment-experience/web-profiles/ \
  -H "Content-Type: application/json" \
  -H "Authorization: $TYPE $TOKEN" \
  -d '{
  "name": "zunkaDefault23",
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

# PP_PROFILE_ID=`echo $PP_WEB_EXP_PROFILE | jq -r .id`
echo $RES | jq -r .