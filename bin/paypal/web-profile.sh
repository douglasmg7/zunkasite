curl -v -X \
  POST https://api.sandbox.paypal.com/v1/payment-experience/web-profiles/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer Access-Token" \
  -d '{
  "name": "zunka_profile",
  "presentation":
  {
    "logo_image": "https://www.paypal.com"
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
}'