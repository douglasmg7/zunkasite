<template lang='pug'>
  div
    .ui.small.modal
      i.close.icon
      .header {{product.storeProductTitle}}
      .content
        form.ui.form
          .ui.segment
            //- detalhes
            h3.ui.dividing.header Detalhes
            .field
              label Zunka Id
              input(v-model='product.storeProductId')
            .field
              label Título
              input(v-model='product.storeProductTitle')
            .field
              label Título fornecedor
              input.ui.disabled.input(v-model='product.dealerProductTitle')
            .field
              label Imagens
              .img-selection(v-if='loadedImages.length > 0' v-for='(image, index) in loadedImages')
                img.ui.tiny.image(:class='{selected: isImagedSelected(index)}', :src='imageSrc(image)' @click='selectImage(index)')
                .right-arrow(@click='moveImage("right", index)')
                .left-arrow(@click='moveImage("left", index)')
              .ui.left.aligned.container
                label.ui.labeled.icon.button(for='file-upload')
                  i.large.upload.icon
                  | &nbsp&nbsp&nbsp&nbspCarregar imagem(s) local
                input(type='file' id='file-upload' accept='image/*' style='display:none' multiple @change='uploadProductPictures()')
                //- label.ui.labeled.icon.button(@click='downloadDealerImages(product)')
                  i.large.upload.icon
                  | &nbsp&nbsp&nbsp&nbspCarregar imagem(s) do fornecedor
            .field
              label Descrição primária
              textarea(v-model='product.storeProductDescPrimary' rows='15')
            .field
              label Descrição completa
              textarea(v-model='product.storeProductDescComplete' rows='15')
            .two.fields
              //- maker
              .field
                label Fabricante
                select.ui.search.dropdown(v-model='product.storeProductMaker')
                  input(v-model='product.storeProductMaker' type='hidden')
                  option(v-for='maker in productMakers', :value='maker.name') {{maker.value}}
              .field
                label Categoria
                select.ui.search.dropdown(v-model='product.storeProductCategory')
                  input(v-model='product.storeProductCategory' type='hidden')
                  option(v-for='category in productCategories', :value='category.name') {{category.value}}
          //- warranty
          .ui.segment
            h3.ui.dividing.header Garantia
            .fields
              .four.wide.field
                label Fornecedor
                .ui.right.labeled.disabled.input
                  input(v-model='product.dealerProductWarrantyDays')
                  .ui.label.basic Dias
              .four.wide.field
                label Loja
                .ui.right.labeled.input
                  input(v-model='product.storeProductWarrantyDays')
                  .ui.label.basic Dias
              .eight.wide.field
                label Observação
                input(v-model='product.storeProductWarrantyDetail')
          //- price
          .ui.segment
            h3.ui.dividing.header Preço
            .field
              .ui.checkbox
                input(type='checkbox' v-model='product.storeProductDiscountEnable')
                label Habilitar desconto
            .fields
              .four.wide.field
                label Fornecedor
                .ui.labeled.disabled.input
                  .ui.label.basic R$
                  input(v-model='product.dealerProductPrice')
              .four.wide.field
                label Lucro
                .ui.right.labeled.input
                  input(v-model='product.storeProductMarkup')
                  .ui.label.basic %
              .four.wide.field
                label Desconto
                .ui.action.input
                  input(v-model='product.storeProductDiscountValue')
                  select.ui.compact.selection.dropdown(v-model='product.storeProductDiscountType')
                    input(v-model='product.storeProductDiscountType' type='hidden')
                    option(value='%') %
                    option(value='R$') R$
              .four.wide.field
                label Loja
                .ui.labeled.disabled.input
                  .ui.label.basic R$
                  input(v-model='finalPrice')
          //- status
          .ui.segment
            h3.ui.dividing.header Status
            .field
              .ui.checkbox
                input(type='checkbox' v-model='product.storeProductCommercialize')
                Label Comercializar produto
            .fields
              .one.wide.field
              .six.wide.field
                label Estoque
                .ui.small.visible.aligned.center.message(v-bind:class='{"warning": product.dealerProductQtd < 5}')
                  .ui.center.aligned.container
                    p {{product.dealerProductQtd}} {{product.dealerProductQtd > 1 ? 'unidades': 'unidade'}}
              .two.wide.field
              .six.wide.field
                label Status fornecedor
                .ui.small.visible.message(v-bind:class='{"warning": !product.dealerProductActive}')
                  .ui.center.aligned.container
                    p {{product.dealerProductActive == true ? 'Produto ativo' : 'Produto inativo'}}
      .actions
        button.ui.positive.button(@click='saveProduct(product)') Salvar
        button.ui.red.deny.button(v-if='!product.isNewProduct') Apagar
        button.ui.red.deny.button(v-if='product.isNewProduct') Descartar
        button.ui.black.deny.button(v-if='!product.isNewProduct') Fechar
</template>
<script>
  'use strict';
  import accounting from 'accounting';
  import wsPath from '../bin/wsPath';
  const self = this;

  export default {
    data: function(){
      return {
        loadedImages: []};
    },
    props:['$http', 'product', 'productMakers', 'productCategories'],
    mounted(){
      // Form event.
      $('.ui.form').form({
        onSuccess: function (event, fields) {
          event.preventDefault();
        }
      });
      // Modal events.
      $('.ui.small.modal').modal({
        onShow: function (){
          setTimeout(function () {
            $('.ui.dropdown').dropdown({duration: 0});
              // Update images urls.
              const vueSelf = appVue.$refs.productsStore.$refs.productStoreDetail;
              vueSelf.updateImagesList(vueSelf.product)
          }, 100);},
        onHidden: function() {
          // Clean images urls for the next time that modal open.
          appVue.$refs.productsStore.$refs.productStoreDetail.loadedImages = [];
          // User not saved new product.
          if (appVue.$refs.productsStore.$refs.productStoreDetail.isNewProduct) {
            // Delete from db.
            this.$http.delete(`${wsPath.store}/${product._id}`, product)
              .then((res)=>{})
              .catch((err)=>{ console.error(err); });
          }
        },
        onDeny() {
          if (confirm("Remover produto?")) { 
            // Delete product.
            const vueSelf = appVue.$refs.productsStore.$refs.productStoreDetail;
            vueSelf.deleteProduct(vueSelf.product);
            return true;
          }
          else{
            return false;
          }
        }     
      })
      .modal('setting', 'duration', 0);
    },    
    methods: {
      // Save product.
      saveProduct(product){
        const isNewProduct = product.isNewProduct;
        // Remove this propertie to keep product on db, when the windows close.
        delete product.isNewProduct;
        // Update product on db.
        this.$http.put(`${wsPath.store}/${product._id}`, product)
          .then((res)=>{
            // Product list must be updated.
            if (isNewProduct) {
              this.$emit('productIncluded');
            } else {
              this.$emit('productSaved');
            }
          })
          .catch((err)=>{ console.error(err); });
      },
      deleteProduct(product){
        // if (!confirm('Remover?')) {return;}
        // Delete from db.
        this.$http.delete(`${wsPath.store}/${product._id}`, product)
          .then((res)=>{
          })
          .catch((err)=>{ console.error(err); });  
        // If prodcut in not new, must be deleted from products list.
        if (!product.isNewProduct) {
          // Event to remove product from list.
          this.$emit('productDeleted');
        }
      },
      // Download dealer images from dealer server.
      downloadDealerImages(product){
        let self = this;
        this.$http.put(`${wsPath.allNations}/download-dealer-images/${product._id}`)
          .then(()=>{
            self.updateImagesList(self.product);
          })
          .catch((err)=>{ console.error(err); });
      },
      // Save picture chosen by the user on the server.
      uploadProductPictures(){
        let files = $('input:file')[0].files;
        // no files
        if (files.length === 0) {
          alert('Nenhuma imagem para upload foi selecionada.');
        // too many files
        } else if (files.length > 4) {
          alert('Selecione no máximo 4 imagens por vez.')
        }
        // it's ok
        else {
          let formData = new FormData();
          for (var i = 0; i < files.length; i++) {
            formData.append('pictures[]', files[i]);
            // formData.append('photos[]', files[i], files[i].name);
          }
          let self = this;
          this.$http.put(`${wsPath.store}/upload-product-images/${this.product.dealer}/${this.product._id}`, formData)
            .then(()=>{
              this.updateImagesList(this.product);
            })
            .catch((err)=>{ console.error(err); });
        }
      },
      // Get list of image names to use with the img tag, to show images.
      updateImagesList(product){
        // get list of images url
        this.$http.get(`${wsPath.store}/get-product-images-url/${product.dealer}/${product._id}`)
          .then(result=>{
            this.loadedImages = result.body;
          })
          .catch(err=>{
            this.loadedImages = ['void'];
            console.error(err);
          })
      },
      // Path to image src tag.
      imageSrc(image) {
        return '/img/' + this.product.dealer.replace(/\s/g, '') + '/products/' + this.product._id + '/' + image;
      },
      moveImage(direction, index){
        // alert('Arrow-' + direction + '-' + index);
        alert(`Arrow - ${direction} - ${index}`);
      },
      selectImage(index){

        alert(`Image selected: ${index}`);
      },
      isImagedSelected(index){
        return true;
      }
    },
    computed: {
      finalPrice() {
        let result = this.product.dealerProductPrice;
        // apply markup
        if (this.product.storeProductMarkup > 0) {
          result *= (1 + (this.product.storeProductMarkup / 100));
        }
        // apply discount
        if (this.product.storeProductDiscountEnable){
          // by value
          if ('R$' === this.product.storeProductDiscountType) {
            result -= this.product.storeProductDiscountValue;
          // by percentage
          } else {
            result -= result * (this.product.storeProductDiscountValue / 100);
          }
        }
        this.product.storeProductPrice = result;
        return accounting.formatMoney(result, '', 2, '.', ',');
      }
    },
    filters: { currencyBr(value){ return accounting.formatMoney(value, "R$ ", 2, ".", ","); }}
  }
</script>
<style lang='stylus'>
  .img-selection
    position: relative
    display: inline-block
    margin: .15em
    border: .15em solid green
  .img-selection:hover 
    .left-arrow{display: block}
    .right-arrow{display: block}
  .left-arrow
    position: absolute
    bottom: 20px
    left: 0
    width: 0
    height: 0
    border-right: 15px solid green
    border-top: 15px solid transparent
    border-bottom: 15px solid transparent
    opacity: .5
    display: none 
  .right-arrow
    position: absolute
    bottom: 20px
    right: 0
    width: 0
    height: 0
    border-left: 15px solid green
    border-top: 15px solid transparent
    border-bottom: 15px solid transparent
    opacity: .5
    display: none
</style>
