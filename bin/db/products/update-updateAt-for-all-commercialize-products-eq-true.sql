print("");
print("Changing batch size to:");
DBQuery.shellBatchSize = 10000

print("");
print("Products that updatedAt will be updated:")
db.products.find({storeProductCommercialize: true}).count();
db.products.find({storeProductCommercialize: true},{ _id: true, dealerName: true, updatedAt: true});

print("");
print("Updating updatedAt for all products with storeProductCommercialize == true");
db.products.updateMany({storeProductCommercialize: true}, { "$currentDate": {"updatedAt": true} });