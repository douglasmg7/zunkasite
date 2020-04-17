#!/usr/bin/env bash

RESULT=$(curl -u zoomteste_zunka:H2VA79Ug4fjFsJb -X POST 'https://merchant.zoom.com.br/api/merchant/order/31559839856/shipment' \
  -H "Content-Type: application/json" \
  -d '{
  "sent_date": "15/01/2020 14:52:16",
  "carrier_name": "Correios",
  "tracking_number": "3434",
  "url": "www.correios.com.br",
  "invoice": {
    "number": "4",
    "access_key": "5",
    "cnpj": "41.381.074/6738-65",
    "issue_date": "15/01/2020 14:52:16",
    "series": "2",
    "url": "3"
  },
  "sent_items": [
    {
      "product_id": "123459789",
      "quantity": 1
    }
  ],
  "shipment_id": "5e8402b4d22d27c70813d1c5"
}')

echo $RESULT