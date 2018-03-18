<template lang='pug'>
  div
    menu-products(active='store' v-bind:user='user' v-on:input='search=arguments[0]' v-on:search='getProducts()' v-on:newProduct='showNewProduct()')
    table
      thead
        tr
          //- th.text-capitalize id
          th.clickable(@click="selectColOrder('code-store')") Código
          th.clickable(@click="selectColOrder('dealerCode')") Título
          th.clickable(@click="selectColOrder('dealerName')") Fornecedor
          //- th.clickable(@click="selectColOrder('dealerCode')") Forn. Id
          th.clickable(@click="selectColOrder('stockLocation')") Local
          th.clickable(@click="selectColOrder('stockQtd')") Estoque
          th.clickable(@click="selectColOrder('priceNum')") Preço
      tbody
        tr(
          v-for="product in products"
          v-bind:class='{"product-commercialize": product.storeProductCommercialize, "product-active": product.dealerProductActive && (product.dealerProductQtd > 5)}'
        )
          //- td {{$index + 1}}
          td.clickable(@click="showProduct(product)" v-bind:data-code="product.code" v-bind:title='product.dealerProductTitle') {{product.storeProductId}}
          td.clickable(@click="showProduct(product)") {{product.storeProductTitle}}
          td.clickable(@click="showProduct(product)") {{product.dealerName}}
          //- td.clickable(@click="showProduct(product)") {{product.dealerProductId}}
          td.clickable(@click="showProduct(product)") {{product.dealerProductLocation}}
          td.clickable(@click="showProduct(product)") {{product.dealerProductQtd}}
          td.clickable(@click="showProduct(product)") {{product.storeProductPrice | currencyBr}}
    .pagination
      a.item(v-for='n in pageCount' @click='getProducts(n)' v-bind:class='{"active": n==page}') {{n}}
      button.open-modal Open Modal
    .my-modal
      .modal-content
        //- h2 {{selectedProduct.storeProductTitle}}
        span.close-modal &times
        .field
          label Código
          input(v-model='selectedProduct.storeProductId')
        .field
          label Título
          input(v-model='selectedProduct.storeProductTitle')
        .field
          label Fornecedor
          input.ui.input(v-model='selectedProduct.dealerName')      
        .field
          label Imagens
          .images
            .wrapper-image(v-if='selectedProduct.images.length > 0' v-for='(image, index) in selectedProduct.images', :class='{selected: image.selected}')
              img.ui.small.image.product-image(:src='imageSrc(image.name)' @click='selectImage(index)')
              .right-arrow(@click='moveImage("right", index)')
              .left-arrow(@click='moveImage("left", index)')
              p.delete-image(@click='deleteImage(index)') x
          .upload-image
            //- | &nbsp&nbsp&nbsp&nbspCarregar imagem(s) local
            label(for='file-upload') 
              svg.icon: use(xlink:href='/icon/sprite.svg#ic_file_upload_black_24px')
              | Carregar imagem(s)
            input(type='file' id='file-upload' accept='image/*' style='display:none' multiple @change='uploadProductImage()')
            //- input(type='file' id='file-upload' accept='image/*' style='display:none' multiple @change='uploadProductImage()')
            //- label.ui.labeled.icon.button(@click='downloadDealerImages(product)')
              i.large.upload.icon
              | &nbsp&nbsp&nbsp&nbspCarregar imagem(s) do fornecedor
        .field
          label Detalhes
          textarea(v-model='selectedProduct.storeProductDetail' rows='8')
        .field
          label Descrição
          textarea(v-model='selectedProduct.storeProductDescription' rows='8')
        .field
          label Informações técnicas
          textarea(v-model='selectedProduct.storeProductTechnicalInformation' rows='8')
        .field
          label Informações adicionais
          textarea(v-model='selectedProduct.storeProductAdditionalInformation' rows='8')
        .two.fields
          //- maker
          .field
            p {{selectedProduct.storeProductMaker}}
            label Fabricante
            select(v-model='selectedProduct.storeProductMaker')
              input(v-model='selectedProduct.storeProductMaker' type='hidden')
              option(v-for='maker in productMakers', :value='maker.name') {{maker.value}}
          .field
            label Categoria
            select(v-model='selectedProduct.storeProductCategory')
              input(v-model='selectedProduct.storeProductCategory' type='hidden')
              option(v-for='category in productCategories', :value='category.name') {{category.value}}
        //- warranty
        .field
          Label Garantia
          .warrant-fields
            .warrant.field(style='flex-grow: 1; flex-basis: 10em')
              label Fornecedor (dias)
              input.input-integer(v-model='selectedProduct.dealerProductWarrantyDays')
            .warrant.field(style='flex-grow: 1; flex-basis: 10em')
              label Loja (dias)
              input.input-integer(v-model='selectedProduct.storeProductWarrantyDays')
            .warrant.field(style='flex-grow: 3; flex-basis: 10em')
              label Observação
              input(v-model='selectedProduct.storeProductWarrantyDetail')
        //- price
        .field
          Label Preço
          .price.fields
            .price.field.checkbox
              input(type='checkbox' v-model='selectedProduct.storeProductDiscountEnable' id='enable-discount')
              label(for='enable-discount') Habilitar desconto
            .price.field(style='flex-grow: 1;')
              label Fornecedor (R$)
              input.input-money(v-model='inputDealerProductPrice')
                //- input(v-model='selectedProduct.dealerProductPrice', @keypress='nopoint')
            .price.field(style='flex-grow: 1;')
              label Lucro (R$)
              input.input-money(v-model='inputStoreProductMarkup')
            .price.field.select(style='flex-grow: auto;')
              label Desconto
              input.input-money(v-model='inputStoreProductDiscountValue')
              select(v-model='selectedProduct.storeProductDiscountType')
                input(v-model='selectedProduct.storeProductDiscountType')
                option(value='%') %
                option(value='R$') R$
            .price.field(style='flex-grow: 1;')
              label Loja (R$)
              input(v-model='inputStoreProductPrice')
      //- status
      //- .ui.segment
        h3.ui.dividing.header Status
        .field
          .ui.checkbox
            input(type='checkbox' v-model='selectedProduct.storeProductCommercialize')
            Label Comercializar produto
        .field
          .four.wide.field
            label Estoque
            .ui.right.labeled.input
              input(v-model='selectedProduct.dealerProductQtd')
              .ui.label.basic {{selectedProduct.dealerProductQtd > 1 ? 'Unidades': 'Unidade'}}           
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
    //- .actions
    //-   button.ui.positive.button(@click='saveProduct()') Salvar
    //-   button.ui.red.deny.button(v-if='!product.isNewProduct') Remover
    //-   button.ui.red.deny.button(v-if='product.isNewProduct') Descartar
    //-   button.ui.black.deny.no-prompt.button(v-if='!product.isNewProduct') Fechar
    products-store-detail(
      ref='productStoreDetail'
      :$http='$http',
      :csrfToken='csrfToken',
      :product='selectedProduct', 
      :productMakers='productMakers', 
      :productCategories='productCategories',
      @productSaved='updateProduct()',
      @productIncluded='includeProduct()'
      @productDeleted='removeProduct()')
</template>
<script>
  /* globals accounting */
  'use strict';
  import accounting from 'accounting';
  // Components.
  import menuProducts from './menuProducts.vue';
  import productsStoreDetail from './productsStoreDetail.vue';
  // let veeValidate = require('vee-validate');
  export default {
    ref: 'productStore',
    components: {
      menuProducts,
      productsStoreDetail
    },
    data: function(){
      return {
        products: ['void'],
        // Deep clone of selected product.
        selectedProduct: {},
        productMakers: ['void'],
        productCategories: ['void'],
        // Curret page for pagination.
        page:1,
        // Number of pages for pagination.
        pageCount: 1,
        // Text for search products.
        search: '',
        // Formatted data for input.
        inputDealerProductPrice: 0,
        inputStoreProductDiscountValue: 0,
        inputStoreProductMarkup: 0,
        inputStoreProductPrice: 0
      }
    },
    props: ['$http', 'user', 'csrfToken'],
    created() {
      this.getProducts();
      this.getDropdown();
    },
    mounted() {
      // Open modal.
      let $modal = $('.my-modal');
      $('.open-modal').click(()=>{
        $modal.css('display', 'block');
      });
      // Close modal.
      $('.close-modal').click(()=>{
        $modal.css('display', 'none');
      });      
      $(document).click(event=>{
        if ($(event.target).hasClass('my-modal')) {
          $modal.css('display', 'none');
        }        
      });
    },
    methods: {
      // Get products page.
      getProducts(page=1){
        // console.warn('search: ', this.search);
        this.$http.get(`/ws/store?page=${page}&search=${this.search}`)
          .then((res)=>{
            this.products = res.body.products;
            this.page = res.body.page;
            this.pageCount = res.body.pageCount;
          })
          .catch((err)=>{ console.error(err); });
      },
      // Open modal with products detail.
      showProduct(product){
        // Deep clone.
        this.selectedProduct = JSON.parse(JSON.stringify(product));
        // Open modal.
        $('.ui.small.modal').modal('show');
      },
      showNewProduct(){
        // Create a new product.
        this.selectedProduct = {
          dealerName: '',
          storeProductId: '',
          storeProductTitle: '',
          storeProductDetail: '',
          storeProductDescription: '',
          storeProductTechnicalInformation: '',
          storeProductAdditionalInformation: '',
          storeProductMaker: '',
          storeProductCategory: '',
          storeProductWarrantyDays: 30,
          storeProductWarrantyDetail: 'Direto com a loja.',
          storeProductMarkup: '0,00',
          storeProductDiscountEnable: false,
          storeProductDiscountValue: '0,00',
          storeProductDiscountType: '%',
          storeProductCommercialize: false,
          dealerProductTitle: '',
          dealerProductWarrantyDays: 90,
          dealerProductQtd: 0,
          dealerProductActive: true,
          dealerProductCommercialize: true,
          dealerProductPrice: 0,
          images: [],
          // Modal must delete this product if user not save it.
          // To modal know which button to show.
          isNewProduct: true
        };
        // Insert product on db.
        this.$http.post(`/ws/store/`, { product: this.selectedProduct, _csrf: this.csrfToken })
          .then((res)=>{
            // Include _id received from db.
            this.selectedProduct._id = res.body._id;
          })
          .catch((err)=>{ console.error(err); });
        // Open modal.
        $('.ui.small.modal').modal('show');
      },      
      // Update product saved by modal.
      updateProduct(){
        try {
          // Look for product to be updated.
          this.products.forEach((element, index)=>{
            if (element._id === this.selectedProduct._id) {
              this.$set(this.products, index, this.selectedProduct);  
            }
          });
        } 
        catch (err){ console.error(err); }
      },
      // Update product saved by modal.
      includeProduct(){
        try {
          // Look for product to be updated.
          this.products.push(this.selectedProduct);
        } 
        catch (err){ console.error(err); }
      },      
      // Remove product deleted by modal.
      removeProduct(){
        // Look for product to update.
        this.products.forEach((element, index)=>{
          if (element._id === this.selectedProduct._id) {
            // Remove product from the list.
            this.$delete(this.products, index);
          }
        });
      },      
      // Get dropdown options.
      getDropdown(){
        this.$http.get(`/ws/store/dropdown`)
          .then((res)=>{
            this.productMakers = res.body.productMakers;
            this.productCategories = res.body.productCategories;
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
          this.$http.put(`/ws/store/upload-product-images/${this.selectedProduct._id}`, formData, { headers: { 'csrf-token': this.csrfToken } })
            .then((result)=>{
              result.body.imageNames.forEach(function(imageName){
                self.selectedProduct.images.push({name: imageName, selected: false});
              });
              // this.getUploadedImageNames(this.product);
            })
            .catch((err)=>{ console.error(err); });
        }
      },
      // Path to image src tag.
      imageSrc(imageName) {
        return '/img/' + this.selectedProduct._id + '/' + imageName;
      },
      moveImage(direction, index){
        // Position to move.
        let toIndex;
        // To right.
        if (direction === 'right') {
          // Last element.
          if ((index + 1) === this.selectedProduct.images.length) {
            toIndex = 0;
          // Not the last element.
          } else  {
            toIndex = index + 1;
          }
        // To left. 
        } else {
          // First element.
          if (index === 0) {
            toIndex = this.selectedProduct.images.length - 1;
          // Not the last element.
          } else  {
            toIndex = index - 1;
          } 
        }
        // Change elements.
        let toIndexElement = this.selectedProduct.images[toIndex];
        this.$set(this.selectedProduct.images, toIndex, this.selectedProduct.images[index]);
        this.$set(this.selectedProduct.images, index, toIndexElement);
      },
      // Select a image from server to be used.
      // Make the selection persistent just when the product be saved.
      selectImage(index){
        // Troggle selection.
        // Remove selection.
        if (this.selectedProduct.images[index].selected){
          this.selectedProduct.images[index].selected = false;
        // Add selection.
        } else {
          this.selectedProduct.images[index].selected = true;
        }
      },   
      // Delete image from server.
      deleteImage(index){
        this.$delete(this.selectedProduct.images, index);
      }   
    },
    filters: {
      currencyBr(value){
        return accounting.formatMoney(value, 'R$ ', 2, '.', ',');
      }
    }
  }
</script>
<style lang='stylus'>
  body
    font-family: 'Arial'
  table
    margin: 0
    border-bottom: solid 1px lightgray
    border-spacing: 0
    width: 100%
    text-align: left
  input, select
    height: 2em
  input[type=checkbox] 
    height: 1em
  input, textarea
    border-radius: .2em
    border: solid 1px #aaa
    outline: none
  input:focus, textarea:focus
    box-shadow: 0 0 3px rgba(81, 203, 238, 1);
    border: 1px solid rgba(81, 203, 238, 1);
  td
    border-top: solid 1px lightgray
    margin: 0
    padding: .3em .2em .3em 0.2em
  th
    padding: .3em .2em .3em 0.2em
  th.clickable, td.clickable
    cursor: pointer
  tr.product-commercialize
    background-color: #F2DEDE
  tr.product-commercialize.product-active
    background-color: #bdffbd
  .pagination
    font-size: 1em
    display: flex
    flex-flow: row wrap
    justify-content: center
    align-items: center
    margin-top: 1em
  .pagination a
    margin: 0 1em 0 1em
    color: lightgray
    cursor: pointer
  .pagination a.active
    color: black
  .my-modal
    display: none
    position: fixed; /* Stay in place */
    z-index: 1; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: auto; /* Enable scroll if needed */
    background-color: rgb(0,0,0); /* Fallback color */
    background-color: rgba(0,0,0,0.4); /* Black w/ opacity */ 
  .modal-content
    background-color: #fefefe;
    margin: 10% auto;
    padding: 1em;
    border-radius: .2em
    width: 95%;
  .close-modal
    color: #aaa
    float: right
    font-size: 2em
  .close-modal:hover,
  .close-modal:focus
    color: black
    text-decoration: none
    cursor: pointer
  .fields
    display: flex
    flex-wrap: wrap 
  .field > label
    margin-top: 1em
    font-weight: bold
    display: block
  .field > .upload-image > label
    margin-top: .3em
  .field > input, .field > textarea
    width: 100%
  .field > input[type=checkbox]
    width: auto
  .field.checkbox label
    display: inline-block  
    margin-left: 0.3em 
  .field > textarea
    padding .5em
  .two.fields > .field
    flex-grow: 1
    flex-basis: 50%
  .two.fields select
    width: 100%
  .two.fields > .field:first-of-type
    padding-right: 1em
  .warrant-fields
    display: flex
    flex-flow: wrap
    border-radius: .2em
    border: 1px solid #aaa
  .warrant.field
    margin: .5em
  .warrant.field label
    margin: 0
  .price.fields
    display: flex
    flex-flow: row wrap
    border: solid 1px #aaa
    border-radius: .2em
  .price.field
    padding: 0.5em
  .price.field label
    margin-top: 0
  .price.field.checkbox
    flex-basis: 100%
  .price.field.select input
    width: auto
  .price.field.checkbox input
    position: relative
    top: 2px
  .images
    border: 1px solid #aaa
    border-radius: .2em
    padding: .4em
    display: flex
    flex-wrap: wrap
    min-height: 4em
  .wrapper-image
    position: relative
    display: inline-block
    margin: .4em
    border: .5em solid transparent
  .wrapper-image.selected
    border: 4px solid green
    border-radius: .2em
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
  .upload-image label
    cursor: pointer
</style>
