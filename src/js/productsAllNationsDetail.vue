<template lang='pug'>
  div
    .ui.small.modal
      i.close.icon
      .header {{product.desc}}
      .content
        table.ui.very.compact.striped.table
          tbody
            tr
              td Id All Nations
              td {{product.code}}
            tr
              td Id Loja
              td {{product.storeProductId ? product.storeProductId : ' - '}}
            tr
              td Última atualização
              td {{product.ts}}
            tr
              td Fabricante
              td {{product.manufacturer}}
            tr
              td Descrição
              td {{product.tecDesc}}
            tr
              td Imagem
              td
                .ui.tiny.images(v-if='product.urlImg')
                  - for(var i=1; i<5; i++)
                    img(v-bind:src='product.urlImg + "-0"' + '+' + i)
            tr
              td Disponibilidade
              td {{product.available ? 'Disponível' : 'Indisponível'}}
            tr
              td Ativo
              td {{product.active ? 'Ativo' : 'Inativo'}}
            tr
              td Estoque
              td {{product.stockQtd}}
            tr
              td Localização
              td {{product.stockLocation}}
            tr
              td Preço
              td {{product.price | currencyBr}}
            tr
              td Preço sem ST
              td {{product.priceNoST | currencyBr}}
            tr
              td Departamento
              td {{product.department}}
            tr
              td Categoria
              td {{product.category}}
            tr
              td Sub-categoria
              td {{product.subCategory}}
            tr
              td PN (Part Number)
              td {{product.partNum}}
            tr
              td EAN (Código de barras)
              td {{product.ean}}
            tr
              td Garantia
              td {{warranty_month}}
              //- td {{product.warranty}} mes(es)
            tr
              td Peso
              td {{product.weight * 1000}} gramas
            tr
              td Largura
              td {{product.width}} cm
            tr
              td Altura
              td {{product.height}} cm
            tr
              td Profundidade
              td {{product.deep}} cm
            tr
              td NCM
              td {{product.ncm}}
            tr
              td Imposto
              td {{product.taxReplace ? 'Incide ICMS ST' : 'Não incide ICMS ST'}}
            tr
              td Origem
              td {{product.origin}}
      .actions
        button.ui.positive.button(@click='setCommercialize(product, true)' v-if='!product.commercialize') Comercializar
        button.ui.negative.button(@click='setCommercialize(product, false)' v-if='product.commercialize') Não Comercializar
        button.ui.black.deny.button Fechar
</template>
<script>
  'use strict';
  import wsPath from '../../bin/wsPath';
  import accounting from 'accounting';
  export default {
    data: function(){
      return {
        msg: 'Products Detail All Nations'
      }
    },
    props:[
      'product'
    ],
    filters: {
      currencyBr(value){
        return accounting.formatMoney(value, "R$ ", 2, ".", ",");
      }
    },
    computed: {
      warranty_month(){
        if(this.product.warranty === 0){
          return 'Sem garantia';
        } else if(this.product.warranty === 1){
          return '1 mes';
        } else{
          return this.product.warranty + ' meses';
        }
      }
    },
    methods: {
      setCommercialize(product, commercialize){
        commercialize = commercialize === true ? true : false;
        console.log(`setCommercialize -> _id: ${product._id}, commercialize: ${commercialize}`);
        this.$http.put(`${wsPath.allNations}/set-commercialize/${product._id}`, {commercialize: commercialize})
          .then((res)=>{
            this.product.commercialize = commercialize;
            this.$emit('save');
          })
          .catch((err)=>{
            alert(`error: ${JSON.stringify(err)}`);
            console.log(`err: ${JSON.stringify(err)}`);
          });
      }
    }
  }
</script>
<style lang='stylus'>
</style>
