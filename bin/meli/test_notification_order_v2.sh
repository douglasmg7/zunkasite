#!/usr/bin/env bash

[[ -z $MERCADO_LIVRE_USER_ID ]] && printf "[error] MERCADO_LIVRE_USER_ID enviorment not defined.\n" >&2 && exit 1 
[[ -z $MERCADO_LIVRE_APP_ID ]] && printf "[error] MERCADO_LIVRE_APP_ID enviorment not defined.\n" >&2 && exit 1 

RESULT=$(curl -X POST https://www.zunka.com.br/ext/meli/notifications \
  -H "Content-Type: application/json" \
  -d '{
      "resource":"/orders/5396664429",
      "user_id": "'$MERCADO_LIVRE_USER_ID'",
      "topic":"orders_v2",
      "application_id": "'$MERCADO_LIVRE_APP_ID'",
      "attempts":1,
      "sent":"2019-10-30T16:19:20.129Z",
      "received":"2019-10-30T16:19:20.106Z"
}')

echo $RESULT