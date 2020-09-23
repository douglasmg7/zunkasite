print("");
print("Changing batch size to:");
DBQuery.shellBatchSize = 10000

print("");
print("Aldo products set to commercialize")
db.products.find({dealerName: "Aldo", storeProductCommercialize: true }).count();
db.products.find({dealerName: "Aldo", storeProductCommercialize: true },{ _id: true, dealerName: true, dealerProductActive: true, updatedAt: true});

print("");
print("Aldo products not set to commercialize")
db.products.find({dealerName: "Aldo", storeProductCommercialize: false }).count();
db.products.find({dealerName: "Aldo", storeProductCommercialize: false },{ _id: true, dealerName: true, dealerProductActive: true, updatedAt: true});

print("");
print("Setting Aldo products to commercialize")
db.products.updateMany({dealerName: "Aldo", storeProductCommercialize: false, dealerProductActive: true}, { "$set": {"storeProductCommercialize": true}, "$currentDate": {"updatedAt": true} })

print("");
print("After command");
print("");
print("Aldo products set to commercialize")
db.products.find({dealerName: "Aldo", storeProductCommercialize: true }).count();
db.products.find({dealerName: "Aldo", storeProductCommercialize: true },{ _id: true, dealerName: true, dealerProductActive: true, updatedAt: true});

print("");
print("Aldo products not set to commercialize")
db.products.find({dealerName: "Aldo", storeProductCommercialize: false }).count();
db.products.find({dealerName: "Aldo", storeProductCommercialize: false },{ _id: true, dealerName: true, dealerProductActive: true, updatedAt: true});


db.products.find({dealerName: "Aldo", storeProductCommercialize: true, storeProductQtd: { $gt: 0 }}, {storeProductQtd: true}).count();
db.products.find({dealerName: "Aldo", storeProductCommercialize: true, storeProductQtd: { $gt: 0 }}, {storeProductQtd: true});