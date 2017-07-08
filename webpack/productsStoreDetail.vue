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
              label Código
              input(v-model='product.storeProductId')
            .field
              label Título
              input(v-model='product.storeProductTitle')
            .field
              label Fornecedor
              input.ui.input(v-model='product.dealerProductTitle')
            .field
              label Imagens
              .wrapper-image(v-if='product.images.length > 0' v-for='(image, index) in product.images', :class='{selected: image.selected}')
                img.ui.small.image.product-image(:src='imageSrc(image.name)' @click='selectImage(index)')
                .right-arrow(@click='moveImage("right", index)')
                .left-arrow(@click='moveImage("left", index)')
                p.delete-image(@click='deleteImage(index)') x
              .ui.left.aligned.container
                label.ui.labeled.icon.button(for='file-upload')
                  i.large.upload.icon
                  | &nbsp&nbsp&nbsp&nbspCarregar imagem(s) local
                input(type='file' id='file-upload' accept='image/*' style='display:none' multiple @change='uploadProductImage()')
                //- label.ui.labeled.icon.button(@click='downloadDealerImages(product)')
                  i.large.upload.icon
                  | &nbsp&nbsp&nbsp&nbspCarregar imagem(s) do fornecedor
            .field
              label Detalhes
              textarea(v-model='product.storeProductDetail' rows='8')
            .field
              label Descrição
              textarea(v-model='product.storeProductDescription' rows='8')
            .field
              label Informações técnicas
              textarea(v-model='product.storeProductTechnicalInformation' rows='8')
            .field
              label Informações adicionais
              textarea(v-model='product.storeProductAdditionalInformation' rows='8')
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
                //- .ui.right.labeled.disabled.input
                .ui.right.labeled.input
                  input.input-integer(v-model='product.dealerProductWarrantyDays')
                  .ui.label.basic Dias
              .four.wide.field
                label Loja
                .ui.right.labeled.input
                  input.input-integer(v-model='product.storeProductWarrantyDays')
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
                .ui.labeled.input
                  .ui.label.basic R$
                  input.input-money(v-model='product.dealerProductPrice')
                  //- input(v-model='product.dealerProductPrice', @keypress='nopoint')
              .four.wide.field
                label Lucro
                .ui.right.labeled.input
                  input.input-money(v-model='product.storeProductMarkup')
                  .ui.label.basic %
              .four.wide.field
                label Desconto
                .ui.action.input
                  input.input-money(v-model='product.storeProductDiscountValue')
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
            .field
              .four.wide.field
                label Estoque
                .ui.right.labeled.input
                  input(v-model='product.dealerProductQtd')
                  .ui.label.basic {{product.dealerProductQtd > 1 ? 'Unidades': 'Unidade'}}           
              .twelve.wide.field
              //- .one.wide.field
              //- .six.wide.field
              //-   label Estoque
              //-   .ui.small.visible.aligned.center.message(v-bind:class='{"warning": product.dealerProductQtd < 5}')
              //-     .ui.center.aligned.container
              //-       p {{product.dealerProductQtd}} {{product.dealerProductQtd > 1 ? 'unidades': 'unidade'}}
              //- .two.wide.field
              //- .six.wide.field
              //-   label Status fornecedor
              //-   .ui.small.visible.message(v-bind:class='{"warning": !product.dealerProductActive}')
              //-     .ui.center.aligned.container
              //-       p {{product.dealerProductActive == true ? 'Produto ativo' : 'Produto inativo'}}                    
      .actions
        button.ui.positive.button(@click='saveProduct()') Salvar
        button.ui.red.deny.button(v-if='!product.isNewProduct') Remover
        button.ui.red.deny.button(v-if='product.isNewProduct') Descartar
        button.ui.black.deny.no-prompt.button(v-if='!product.isNewProduct') Fechar
</template>
<script>
  'use strict';
  import accounting from 'accounting';
  import wsPath from '../bin/wsPath';
  const self = this;

  export default {
    data: function(){
      return {
        // images: []
      };
    },
    props:['$http', 'product', 'productMakers', 'productCategories'],
    created(){


      // window.nopoint = function(event){
      //   console.warn(event.which);
      //   if (event.which >= 48 && event.which <= 57 || event.which === 44) {
      //     console.warn(true);
      //     event.preventDefault();
      //   } else {
      //     console.log(false);
      //   }
      // }

      // window.addEventListener('keypress', function(e){
      //   console.log(e.target);
      // });
    },
    mounted(){
      // Input-money.
      $('.input-money').on('keypress', function(event){
        if (true) {}
        return (
          // 0-9.
          event.which >= 48 && event.which <= 57 || 
          // , (just one).
          event.which === 44 && (event.target.value.match(/,/) === null) ||
          // Arrows and delete.
          event.which === 0 ||
          // Backspace.
          event.which === 8
        );
      });
      // Input-money.
      $('.input-integer').on('keypress', function(event){
        return (
          // 0-9
          event.which >= 48 && event.which <= 57 || 
          // Arrows and delete.
          event.which === 0 ||
          // Backspace.
          event.which === 8
        );
      });
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
              
              // if (vueSelf.product._id) {
              //   vueSelf.getUploadedImageNames(vueSelf.product)
              // }
          }, 100);},
        onHidden: function() {
          const vueSelf = appVue.$refs.productsStore.$refs.productStoreDetail;
          // User not saved new product.
          if (vueSelf.product.isNewProduct) {
            // Delete from db.
            vueSelf.$http.delete(`${wsPath.store}/${vueSelf.product._id}`)
              .then((res)=>{})
              .catch((err)=>{ console.error(err); });
          } 
        },
        onDeny(e) {
          // No prompt, just close the modal.
          if (e.hasClass('no-prompt')) {
            return true;
          }
          // Prompt.
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
      // nopoint: function(event){
      //   // console.info(event.charCode);
      //   console.log(event.which);
      //   if (event.which >= 48 && event.which <= 57 || event.which === 44) {
      //   } else {
      //     event.preventDefault();
      //   }
      // },
      // Save product.
      saveProduct(){
        let self = this;
        const wasNewProduct = this.product.isNewProduct;
        // Keep product on db, when the windows close.
        this.product.isNewProduct = false;
        // Update product on db.
        this.$http.put(`${wsPath.store}/${this.product._id}`, this.product)
          .then((res)=>{
            // Product list must be updated.
            if (wasNewProduct) {
              this.$emit('productIncluded');
            } else {
              this.$emit('productSaved');
            }
          })
          .catch((err)=>{ console.error(err); });
      },

      // Delete a product.
      deleteProduct(product){
        // Delete from db.
        this.$http.delete(`${wsPath.store}/${product._id}`)
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
          })
          .catch((err)=>{ console.error(err); });
      },

      // Upload pictures to server.
      uploadProductImage(){
        let self = this;
        let files = $('input:file')[0].files;
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
          this.$http.put(`${wsPath.store}/upload-product-images/${this.product._id}`, formData)
            .then((result)=>{
              result.body.imageNames.forEach(function(imageName){
                self.product.images.push({name: imageName, selected: false});
              });
              // this.getUploadedImageNames(this.product);
            })
            .catch((err)=>{ console.error(err); });
        }
      },

      // Path to image src tag.
      imageSrc(imageName) {
        return '/img/' + this.product._id + '/' + imageName;
      },
      moveImage(direction, index){
        // Position to move.
        let toIndex;
        // To right.
        if (direction === 'right') {
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
      // Select a image from server to be used.
      // Make the selection persistent just when the product be saved.
      selectImage(index){
        // Troggle selection.
        // Remove selection.
        if (this.product.images[index].selected){
          this.product.images[index].selected = false;
        // Add selection.
        } else {
          this.product.images[index].selected = true;
        }
      },
      // Delete image from server.
      deleteImage(index){
        this.$delete(this.product.images, index);
      }
    },
    computed: {
      finalPrice() {
        let result;
        if (this.product.dealerProductPrice) {
          result = this.product.dealerProductPrice.replace(',', '.');
        }
        // console.warn('result', result);
        // console.warn('type', typeof(result));
        // apply markup
        if (this.product.storeProductMarkup > 0) {
          result *= (1 + (this.product.storeProductMarkup.replace(',', '.') / 100));
        }
        // apply discount
        if (this.product.storeProductDiscountEnable){
          // by value
          if ('R$' === this.product.storeProductDiscountType) {
            result -= this.product.storeProductDiscountValue.replace(',', '.');
          // by percentage
          } else {
            result -= result * (this.product.storeProductDiscountValue.replace(',', '.') / 100);
          }
        }
        this.product.storeProductPrice = accounting.formatMoney(result, '', 2, '.', ',');
        // console.warn('storeProductPrice: ', this.product.storeProductPrice);
        return this.product.storeProductPrice;
      }
    },
    filters: { currencyBr(value){ return accounting.formatMoney(value, "R$ ", 2, ".", ","); }}
  }
</script>
<style lang='stylus'>
  .wrapper-image
    position: relative
    display: inline-block
    margin: .15em
    border: .5em solid transparent
  .wrapper-image.selected
    border: .5em solid green
  .wrapper-image:hover 
    .left-arrow{display: block}
    .right-arrow{display: block}
    p.delete-image{display: block}
  .left-arrow
    position: absolute
    bottom: 5px
    left: 0
    width: 0
    height: 0
    border-right: 15px solid orange
    border-top: 15px solid transparent
    border-bottom: 15px solid transparent
    opacity: 1
    cursor: pointer
    display: none 
  .right-arrow
    position: absolute
    bottom: 5px
    right: 0
    width: 0
    height: 0
    border-left: 15px solid orange
    border-top: 15px solid transparent
    border-bottom: 15px solid transparent
    opacity: 1
    cursor: pointer
    display: none
  p.delete-image
    position: absolute
    top: -8px
    right: 4px
    opacity: 1
    color: orange
    font-size: 1.5em
    font-weight: bold
    cursor: pointer
    display: none
</style>
