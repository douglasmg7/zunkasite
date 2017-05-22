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
              label Hard Plus Id
              input(v-model='product.storeProductId')
            .field
              label Título
              input(v-model='product.storeProductTitle')
            .field
              label Título fornecedor
              input.ui.disabled.input(v-model='product.dealerProductTitle')
            .field
              label Imagens
              .ui.tiny.images
                img(v-for='image in loadedImages', :src='"/img/allnations/products/" + product.dealerProductId + "/" + image')
              .ui.left.aligned.container
                label.ui.labeled.icon.button(for='file-upload')
                  i.large.upload.icon
                  | &nbsp&nbsp&nbsp&nbspCarregar imagem(s) local
                input(type='file' id='file-upload' accept='image/*' style='display:none' multiple @change='uploadProductPictures(product)')
                label.ui.labeled.icon.button(@click='loadDealerImages(product)')
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
        button.ui.black.deny.button Fechar
</template>
<script>
  'use strict';
  import accounting from 'accounting';
  import wsPath from '../../bin/wsPath';
  let self = this;
  // initialize
  $(document).ready(function(){
    // // initialize dropdown
    // $('.ui.dropdown')
    //   .dropdown({duration: 0});
    $('.ui.form').form({
      onSuccess: function (event, fields) {
        event.preventDefault();
      }
    })
  });
  export default {
    data: function(){
      return {
        msg: 'Products Detail Store',
        loadedImages: ['void']};
    },
    created() {
      //  modal opened
      var self = this;
      window.eventHub.$on('modal-onShow', function(){
        self.updateImagesList(self.product);
      });
    },
    props:['product', 'productMakers', 'productCategories'],
    filters: { currencyBr(value){ return accounting.formatMoney(value, "R$ ", 2, ".", ","); }},
    methods: {
      saveProduct(product){
        this.$http.put(`${wsPath.store}/${product._id}`, product)
          .then((res)=>{
            this.$emit('save');
          })
          .catch((err)=>{
            alert(`error: ${JSON.stringify(err)}`);
            console.log(`err: ${JSON.stringify(err)}`);
          });
      },
      loadDealerImages(product){
        let self = this;
        this.$http.put(`${wsPath.allNations}/download-dealer-images/${product._id}`)
          .then(()=>{
            self.updateImagesList(self.product);
          })
          .catch(err=>{
            alert(`error: ${JSON.stringify(err)}`);
            console.log(`err: ${JSON.stringify(err)}`);
          })
      },
      uploadProductPictures(product){
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
          this.$http.put(`${wsPath.store}/upload-product-images/${product.dealerProductId}`, formData)
            .then(()=>{
              this.updateImagesList(this.product);
            })
            .catch(err=>{
              alert(`error: ${JSON.stringify(err)}`);
              console.log(`err: ${JSON.stringify(err)}`);
            })
        }
      },
      updateImagesList(product){
        // get list of images url
        this.$http.get(`${wsPath.store}/get-product-images-url/${product.dealerProductId}`)
          .then(result=>{
            // console.log(`${JSON.stringify(result.body)}`);
            this.loadedImages = result.body;
          })
          .catch(err=>{
            this.loadedImages = ['void'];
            console.log(`error: ${err}`);
          })
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
      },
    }
  }
</script>
<style lang='stylus'>
</style>
