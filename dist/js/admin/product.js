// Calculate final price with discount.
let calcFinalPrice = function(){
  const txtDealerPrice = document.getElementById('dealerPrice');
  const txtMarkup = document.getElementById('markup');
  const txtDiscount = document.getElementById('discount');
  const txtFinalPrice = document.getElementById('finalPrice');
  const chbEnableDiscount = document.getElementById('discountEnable');
  const selDiscountType = document.getElementById('discountType');
  return function(){
    // Price with markup.
    let priceWithMarkup = txtDealerPrice.value * (txtMarkup.value / 100 + 1)
    // Use discount.
    if(chbEnableDiscount.checked){
      // Use percentage.
      if(selDiscountType.value === '%'){
        txtFinalPrice.value = priceWithMarkup * (1 - (txtDiscount.value / 100));
      }
      // Use monetary value.
      else {
        txtFinalPrice.value = priceWithMarkup - txtDiscount.value;
      }
    }
    // No discount.
    else {
      txtFinalPrice.value = priceWithMarkup;
    }
  }
}();

// Swap out image to right or left.
function swapOutImage(target, direction){
  // Origin position.
  let elWrapOrigin = target.parentNode;
  // Destination position.
  let elWrapDestination = null;
  // To right.
  if (direction === 'right') {
    // Get right side element or the first one.
    elWrapDestination = elWrapOrigin.nextElementSibling;
    // Last element, get the first one.
    if(elWrapDestination === null){
      elWrapDestination = elWrapOrigin.parentNode.children[0];
    }
  // To left. 
  } else {
    // Get left side element or the last one.
    elWrapDestination = elWrapOrigin.previousElementSibling;
    // First element, get the last one.
    if(elWrapDestination === null){
      let allWrap = elWrapOrigin.parentNode.children;
      elWrapDestination = allWrap[allWrap.length - 1];
    }
  }
  // Swap out image src.
  let elImgA = elWrapOrigin.querySelectorAll('img')[0];
  let elImgB = elWrapDestination.querySelectorAll('img')[0];
  let imgSrcB = elImgB.getAttribute('src');
  elImgB.setAttribute('src', elImgA.getAttribute('src'));
  elImgA.setAttribute('src', imgSrcB);
};

// Delete image.
function deleteImage(target){
  let el = target.parentNode;
  el.parentNode.removeChild(el);
}

// Upload pictures to server.
function uploadProductImage(productId, csrfToken){
  let self = this;
  let files = document.getElementById('fleImageUpload').files;
  // no files
  if (files.length === 0) {
    alert('Nenhuma imagem para upload foi selecionada.');
  // too many files
  } else if (files.length > 8) {
    alert('Selecione no máximo 8 imagens por vez.')
  }
  // it's ok
  else {
    let formData = new FormData();
    for (var i = 0; i < files.length; i++) {
      formData.append('pictures[]', files[i]);
      // formData.append('photos[]', files[i], files[i].name);
    }
    // Send files.
    let xhr = new XMLHttpRequest();
    xhr.open('PUT', `/ws/store/upload-product-images/${productId}`, true);
    xhr.setRequestHeader('csrf-token', csrfToken);   
    xhr.onload = function() {
      if (xhr.status === 200) {
        let imagesName = JSON.parse(xhr.responseText).imageNames;
        // Get all wrap images.
        let wrapImages = document.getElementsByClassName('wrapper-image');
        // Get the last wrap image.
        let lastWrapImage = wrapImages[wrapImages.length - 1];
        for (var i = 0; i < imagesName.length; i++) {
          // Create a clone wrap image.
          let newWrapImage = lastWrapImage.cloneNode(true);
          // Update src.
          newWrapImage.querySelectorAll('img')[0].setAttribute('src', `/img/${productId}/${imagesName[i]}`)
          // Insert at end.
          lastWrapImage.insertAdjacentElement('afterend', newWrapImage);
          // Update last elemente var.
          lastWrapImage = newWrapImage;
        }
      } else{
        console.error(`PUT /ws/store/upload-product-images, status: ${xhr.status}, responseText: ${xhr.responseText}`);
      }
    };
    xhr.onerror = function(err){
      console.error(`PUT /ws/store/upload-product-images: ${err}` );
    }
    xhr.send(formData);
  }
}     

// // Save product (submit input).
// function saveProduct(ev){
//   ev.preventDefault();
//   // User form formData.
//   let formData = new FormData(frmProduct);
//   formData.append('asdf', 1234);
//   // Send formData.
//   let xhr = new XMLHttpRequest();
//   xhr.open('POST', window.location.pathname, true);
//   // xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
//   // xhr.setRequestHeader('Accept', 'application/json, application/xml, text/plain, text/html, *.*');
//   xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
//   xhr.setRequestHeader('csrf-token', document.getElementById('_csrf').value);   
//   xhr.onload = function() {
//     if (xhr.status === 200) {
//       console.log(xhr.responseText);
//     } else{
//       console.error(`POST ${window.location.pathname}, status: ${xhr.status}, responseText: ${xhr.responseText}`);
//     }
//   };
//   xhr.onerror = function(err){
//     console.error(`POST ${window.location.pathname}: ${err}` );
//   }
//   console.log(formData.get('dealer'));
//   // xhr.send(formData); 
//   // let a = new FormData();
//   // a.append('id', 1341341234);
//   let csrf = document.getElementById('_csrf').value;
//   data = { _csrf: csrf, id: 234-50845};
//   xhr.send(JSON.stringify(data));  
// }

// // Save product (submit input).
// function saveProduct(ev){
//   ev.preventDefault();
//   // User form formData.
//   let formData = new FormData(frmProduct);
//   formData.append('asdf', 1234);
//   let csrf = document.getElementById('_csrf').value;

//   $.ajax({
//     method: 'POST',
//     url: window.location.pathname,
//     dataType: 'json',
//     data: { _csrf: csrf, id: 1304198374}
//   })
//   .done(function(result){
//     console.log(result);
//   });   
// }

// Save product (submit input).
function saveProduct(ev){
  ev.preventDefault();
  // User form formData.
  let formData = new FormData(frmProduct);
  let csrf = document.getElementById('_csrf').value;
  formData.append('_csrf', csrf);

  $.ajax({
    method: 'POST',
    url: window.location.pathname,
    headers: {'csrf-token': csrf},
    processData: false,
    contentType: false,
    data: formData
  })
  .done(function(result){
    console.log(result);
  });   
}

// Start scripts.
ready(()=>{
  let frmProduct = document.getElementById('frmProduct');
  frmProduct.reset();
  frmProduct.addEventListener('submit', saveProduct, false);  

  calcFinalPrice();
});