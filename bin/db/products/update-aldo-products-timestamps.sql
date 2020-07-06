print("");
print("Changing batch size to:");
DBQuery.shellBatchSize = 10000

print("");
print("Getting Aldo products")
db.products.find({dealerName: "Aldo", storeProductCommercialize: true, deletedAt: { $exists: false } }).count();
db.products.find({dealerName: "Aldo", storeProductCommercialize: true, deletedAt: { $exists: false } },{ _id: false, dealerProductId: true, storeProductQtd: true, updatedAt: true}).sort({updatedAt: -1});


print("");
print("Updating Aldo products updatedAt to now")
db.products.updateMany({dealerName: "Aldo", storeProductCommercialize: true, deletedAt: { $exists: false }}, {"$currentDate": {"updatedAt": true} })