# Mercado livre api

## Public API

### Search items with free shipping
https://api.mercadolibre.com/sites/MLB/search?q=tablet&shipping_cost=free

### Get all active products from a seller
https://api.mercadolibre.com/sites/MLB/search?seller_id=360790045#json
#### Show only results and paging
https://api.mercadolibre.com/sites/MLB/search?seller_id=360790045&attributes=results,paging#json

### Get products, show only title, status and available quantity
https://api.mercadolibre.com/items?ids=MLB1738348205,MLB1793725519&attributes=title,status,available_quantity

### Get product
https://api.mercadolibre.com/items/MLB1435194576

### Get possible categories for a spcific title
https://api.mercadolibre.com/sites/MLB/domain_discovery/search?q=laptop%20dell#json


