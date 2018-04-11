var app = new Vue({
  el: '#app',
  data: {
    product: product,
    productMakers: productMakers,
    productCategories: productCategories,
    validation: { 
      discount: '',
      markup: '' 
    }
  },
  methods: {
    // // Calculate final price with discount.
    calcFinalPrice(){
      // Price with markup.
      let priceWithMarkup = product.dealerProductPrice * (product.storeProductMarkup / 100 + 1)
      // Use discount.
      if(product.storeProductDiscountEnable){
        // Use percentage.
        if(product.storeProductDiscountType === '%'){
          product.storeProductPrice = priceWithMarkup * (1 - (product.storeProductDiscountValue / 100));
        }
        // Use monetary value.
        else {
          product.storeProductPrice = priceWithMarkup - product.storeProductDiscountValue;
        }
      }
      // No discount.
      else {
        product.storeProductPrice = priceWithMarkup;
      }
    },
    // Send form data.
    saveProduct(){
      axios({
        method: 'post',
        url: window.location.pathname,
        headers:{'csrf-token' : csrfToken},
        data: { product: product }
      })
      .then(response => {
        // console.log(response.data);
        // Validation error.
        if (response.data.validation) {
          // Save returned validation to vue data validation.
          for (key in response.data.validation){
            this.validation[key] = response.data.validation[key];
          }
        // No error validation.
        } else {
        // Clean error validation.
          for (key in this.validation){
            this.validation[key] = '';
          }
        }
        // Server side error.
        if (response.data.err) {
          alert('Não foi possível salvar.');
        }
      })
      .catch(e => {
        alert('Não foi possível salvar.');
        console.error(e);
      })       
    }
  }
});

// // Swap out image to right or left.
// function swapOutImage(target, direction){
//   // Origin position.
//   let elWrapOrigin = target.parentNode;
//   // Destination position.
//   let elWrapDestination = null;
//   // To right.
//   if (direction === 'right') {
//     // Get right side element or the first one.
//     elWrapDestination = elWrapOrigin.nextElementSibling;
//     // Last element, get the first one.
//     if(elWrapDestination === null){
//       elWrapDestination = elWrapOrigin.parentNode.children[0];
//     }
//   // To left. 
//   } else {
//     // Get left side element or the last one.
//     elWrapDestination = elWrapOrigin.previousElementSibling;
//     // First element, get the last one.
//     if(elWrapDestination === null){
//       let allWrap = elWrapOrigin.parentNode.children;
//       elWrapDestination = allWrap[allWrap.length - 1];
//     }
//   }
//   // Swap out image src.
//   let elImgA = elWrapOrigin.querySelectorAll('img')[0];
//   let elImgB = elWrapDestination.querySelectorAll('img')[0];
//   let imgSrcB = elImgB.getAttribute('src');
//   elImgB.setAttribute('src', elImgA.getAttribute('src'));
//   elImgA.setAttribute('src', imgSrcB);
// };

// // Delete image.
// function deleteImage(target){
//   let el = target.parentNode;
//   el.parentNode.removeChild(el);
// }

// // Upload pictures to server.
// function uploadProductImage(productId, csrfToken){
//   let self = this;
//   let files = document.getElementById('fleImageUpload').files;
//   // no files
//   if (files.length === 0) {
//     alert('Nenhuma imagem para upload foi selecionada.');
//   // too many files
//   } else if (files.length > 8) {
//     alert('Selecione no máximo 8 imagens por vez.')
//   }
//   // it's ok
//   else {
//     let formData = new FormData();
//     for (var i = 0; i < files.length; i++) {
//       formData.append('pictures[]', files[i]);
//       // formData.append('photos[]', files[i], files[i].name);
//     }
//     // Send files.
//     let xhr = new XMLHttpRequest();
//     xhr.open('PUT', `/ws/store/upload-product-images/${productId}`, true);
//     xhr.setRequestHeader('csrf-token', csrfToken);   
//     xhr.addEventListener('load', function() {
//       if (xhr.status === 200) {
//         let imagesName = JSON.parse(xhr.responseText).imageNames;
//         // Get all wrap images.
//         let wrapImages = document.getElementsByClassName('wrapper-image');
//         // Get the last wrap image.
//         let lastWrapImage = wrapImages[wrapImages.length - 1];
//         for (var i = 0; i < imagesName.length; i++) {
//           // Create a clone wrap image.
//           let newWrapImage = lastWrapImage.cloneNode(true);
//           // Update src.
//           newWrapImage.querySelectorAll('img')[0].setAttribute('src', `/img/${productId}/${imagesName[i]}`)
//           // Insert at end.
//           lastWrapImage.insertAdjacentElement('afterend', newWrapImage);
//           // Update last elemente var.
//           lastWrapImage = newWrapImage;
//         }
//       } else{
//         console.error(`PUT /ws/store/upload-product-images, status: ${xhr.status}, responseText: ${xhr.responseText}`);
//       }
//     });
//     xhr.addEventListener('error', function(err){
//       console.error(`PUT /ws/store/upload-product-images: ${err}` );
//     });
//     xhr.send(formData);
//   }
// }     


