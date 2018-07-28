// Search for products.
function _search(text){
  window.location.href = `/?page=1&search=${text}`;
}
// Vue.
var app = new Vue({
  el: '#app',
  data: {
    // user.
    user: user,
    // Cart.
    cart: cart
  },
  methods: {
    changeProductQtd(product){
      console.log(product._id);
      console.log(product.qtd);
      axios({
        method: 'put',
        url: `cart/change-qtd/${product._id}/${product.qtd}`,
        headers: {'csrf-token' : csrfToken},
      })
      .then((res)=>{
        // Success.
        if (res.data.success) {
          this.cart = res.data.cart;          
        }
      })
      .catch((err)=>{
        alert('Erro interno, não foi possível atualizar o carrinho.');
        console.error(`Error - changeProductQtd(), err: ${err}`);
      });
    },
  },
  filters: { 
    currencyBr(value){ return accounting.formatMoney(value, "R$", 2, ".", ","); },
    // currencyInt(value){
    //   return accounting.formatMoney(accounting.parse(value, ','), '', 2, '.', ',').split(',')[0];
    // },
    // currencyCents(value){
    //   return accounting.formatMoney(accounting.parse(value, ','), '', 2, '.', ',').split(',')[1];
    // }
  },
});



//   // Remove a cart item.
//   $('a.remove-product').on('click', function(event){
//     // a.remove-product
//     let $target = $(event.target);
//     let $aTitle = $target.prev();
//     let product_id = $target.closest('tr').data('product_id');
//     $.ajax({
//       method: 'PUT',
//       url: 'cart/remove/' + product_id,
//       data: { _csrf: '#{csrfToken}'}
//     })
//     .done(function(result){
//       // Update title.
//       $target.closest('tr').html(
//         $('<td class="product-removed" colspan="5"></td>')
//           .append($aTitle.removeClass('product-title'))
//           .append('<span> Foi removido do carrinho de compras. </span>')
//       );
//       // Update price and quantity.
//       $('#subtotal-price')
//         .html(formatMoney(result.cart.totalPrice))
//         .prev().html('Subtotal (' + result.cart.totalQtd + (result.cart.totalQtd > 1 ? ' itens):&nbsp' : ' item):&nbsp'));
//       // Update quantity.
//       $('#total-qtd').html(result.cart.totalQtd);
//     });
//   });
// style.
//   #subtotal-price{
//     color: green;
//     font-weight: bold;
//   }
//   img.product{
//     max-width: 100px;
//     height: auto;
//   }
//   footer p {
//     font-size: .9em;
//   }
//   a.product-title {
//     display: block;
//     text-decoration: none;
//   }
//   a.remove-product {
//     font-size: .9em;
//     cursor: pointer;
//   }
//   p.product-price,
//   p.product-qtd,
//   a.product-title {
//     font-size: 1.2em;
//     padding-top: .6em;
//   }
//   p.product-price,
//   p.product-qtd {
//     color: green;
//   }
//   .product-removed {
//     font-size: .9em;
//   }
//   a.checkout {
//     margin-left: 2em;
//   }
