var app = new Vue({
  el: '#app',
  data: {
    currentPage: 'product',
    product: product,
    productMakers: productMakers,
    productCategories: productCategories,
    user: user,
    search: '',
    validation: { 
      storeProductDiscountValue: '',
      storeProductMarkup: '',
      dealerProductPrice: '',
      dealerProductQtd: '',
      storeProductHeight: '',
      storeProductLength: '',
      storeProductWeight: '',
      storeProductWidth: ''
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
          product.storeProductPrice = (priceWithMarkup * (1 - (product.storeProductDiscountValue / 100))).toFixed(2);
        }
        // Use monetary value.
        else {
          product.storeProductPrice = (priceWithMarkup - product.storeProductDiscountValue).toFixed(2);
        }
      }
      // No discount.
      else {
        product.storeProductPrice = priceWithMarkup.toFixed(2);
      }
    },
    // Save product.
    saveProduct(){
      axios({
        method: 'post',
        url: window.location.pathname,
        headers:{'csrf-token' : csrfToken},
        data: { product: product }
      })
      .then(response => {
        // Validation error.
        if (response.data.validation) {
          for (key in this.validation){
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
        // Saved.
        }
        if (response.data.isNew) {
          window.location.href = `/admin/product/${response.data.product._id}`
        }
      })
      .catch(err => {
        alert('Não foi possível salvar.');
        console.error(err);
      })       
    },
    // Delete product.
    deleteProduct(){
      if(confirm('Confirma a remoção do produto?')){
        axios({
          method: 'delete',
          url: window.location.pathname,
          headers:{'csrf-token' : csrfToken},
          data: { product_id: product._id }
        })
        .then(response => {
          // Server side error.
          if (response.data.err) {
            alert('Não foi possível apagar o produto.');
          }
          else {
            window.location.href = '/admin/';
          }
        })
        .catch(e => {
          alert('Não foi possível apagar o produto.');
          console.error(e);
        })            
      }
    },    
    moveImage(index, direction){
      // Position to move.
      let toIndex;
      // To right.
      if (direction === 'r') {
        // Last element.
        if ((index + 1) === this.product.images.length) {
          toIndex = 0;
        // Not the last element.
        } else  {
          toIndex = index + 1;
        }
      // To left. 
      } else {
        // First element.
        if (index === 0) {
          toIndex = this.product.images.length - 1;
        // Not the last element.
        } else  {
          toIndex = index - 1;
        } 
      }
      // Change elements.
      let toIndexElement = this.product.images[toIndex];
      this.$set(this.product.images, toIndex, this.product.images[index]);
      this.$set(this.product.images, index, toIndexElement);
    },
    // Delete image.
    deleteImage(index){
      this.$delete(this.product.images, index);
    },
    // Upload image to server.
    uploadImage(){
      let self = this;
      let files = document.getElementById('uploadImage').files;
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
        }
        // Send images.
        axios({
          method: 'put',
          url: `/admin/upload-product-images/${this.product._id}`,
          headers:{'csrf-token' : csrfToken},
          data: formData
        })
        .then(response => {
          // Include images on client.
          response.data.images.forEach(function(image){
            self.product.images.push(image);
          });
        })
        .catch(e => {
          alert('Não foi possível salvar.');
          console.error(e);
        }) 
      }
    },
  }
});