print("");
print("Aldo products set to commercialize")
db.products.find({dealerName: "Aldo", storeProductCommercialize: true }).count();
db.products.find({dealerName: "Aldo", storeProductCommercialize: true },{ _id: true, dealerName: true, storeProductCommercialize: true, updatedAt: true});

print("");
print("Aldo products not set to commercialize")
db.products.find({dealerName: "Aldo", storeProductCommercialize: false }).count();
db.products.find({dealerName: "Aldo", storeProductCommercialize: false },{ _id: true, dealerName: true, storeProductCommercialize: true, updatedAt: true});

print("");
print("Setting Aldo products to not commercialize")
db.products.updateMany({dealerName: "Aldo", storeProductCommercialize: true}, { "$set": {"storeProductCommercialize": false}, "$currentDate": {"updatedAt": true} })

print("");
print("After command");
print("");
print("Aldo products set to commercialize")
db.products.find({dealerName: "Aldo", storeProductCommercialize: true }).count();
db.products.find({dealerName: "Aldo", storeProductCommercialize: true },{ _id: true, dealerName: true, storeProductCommercialize: true, updatedAt: true});

print("");
print("Aldo products not set to commercialize")
db.products.find({dealerName: "Aldo", storeProductCommercialize: false }).count();
db.products.find({dealerName: "Aldo", storeProductCommercialize: false },{ _id: true, dealerName: true, storeProductCommercialize: true, updatedAt: true});



db.products.find({dealerName: "Aldo", storeProductCommercialize: true, storeProductQtd: { $gt: 0 }}, {storeProductQtd: true});

db.products.updateMany({dealerName: "Aldo", storeProductCommercialize: true, storeProductQtd: { $gt: 0 }}, { "$set": {"storeProductCommercialize": false}, "$currentDate": {"updatedAt": true} })