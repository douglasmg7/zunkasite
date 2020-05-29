print("");
print("Aldo products set to commercialize")
db.products.find({dealerName: "Aldo", storeProductCommercialize: true }).count();
db.products.find({dealerName: "Aldo", storeProductCommercialize: true },{ _id: true, dealerName: true, storeProductCommercialize: true, updatedAt: true});

print("");
print("Aldo products not set to commercialize")
db.products.find({dealerName: "Aldo", storeProductCommercialize: false }).count();
db.products.find({dealerName: "Aldo", storeProductCommercialize: false },{ _id: true, dealerName: true, storeProductCommercialize: true, updatedAt: true});