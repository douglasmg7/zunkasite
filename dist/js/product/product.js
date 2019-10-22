'use strict';

// Search for products.
function _search(text){
  window.location.href = `/all?page=1&search=${text}`;
}

// Vue.
var app = new Vue({
    el: '#app',
    data: {
        product: product,
        search: '',
        selectedThumbnail: 0,   // Selected thumbnail image.
        cepDestiny: '',
        showEstimatedShipment: false,
        loadingEstimateShipment: false,
        cepErrMsg: '',
        // Delivery time in days.
        estimateShipmentData: [],
        showModal: false,
        productDescriptionWithTitle: false,
    },
    methods: {
        // Accaunting.
        accountingParse: accounting.parse,
        // Get shimpment value from Correios.
        estimateShipment(){
            if (this.cepDestiny.trim() === "") {
                this.cepErrMsg = "Valor inválido.";
                return;
            }
            this.loadingEstimateShipment = true;
            axios({
                method: 'get',
                url:`/checkout/ship-estimate?productId=${this.product._id}&cepDestiny=${this.cepDestiny}`,
                headers:{'csrf-token' : csrfToken},
                data: { productId: this.product._id, cepDestiny: this.cepDestiny }
            })
                .then(response => {
                    // Server error.
                    if (response.data.err) {
                        console.log(response.data.err);
                        this.showEstimatedShipment = false;
                        // this.cepErrMsg = response.data.err;
                        this.cepErrMsg = 'Serviço indisponível';
                    } 
                    // No result.
                    else if (response.data.delivery.length == 0){
                        this.showEstimatedShipment = false;
                        this.cepErrMsg = 'Sem resultados para o CEP informado';
                    } 
                    // Some result.
                    else {
                        this.cepErrMsg = '';
                        // console.log(`response.data.correio: ${JSON.stringify(response.data.correio)}`);
                        this.estimateShipmentData = [];
                        for (let index = 0; index < response.data.delivery.length; index++) {
                            let deliveryData = {
                                service: response.data.delivery[index].method,
                                price: response.data.delivery[index].price,
                                time:  `${response.data.delivery[index].deadline} dia(s)`
                            };
                            this.estimateShipmentData.push(deliveryData);
                        }
                        this.showEstimatedShipment = true;
                    }
                    this.loadingEstimateShipment = false;
                })
                .catch(err => {
                    // console.error(err);
                    this.loadingEstimateShipment = false;
                    this.showEstimatedShipment = false;
                });
        },
        // Add product to cart.
        addToCart(){
            axios({
                method: 'put',
                url:`/cart/add/${this.product._id}`,
                headers:{'csrf-token' : csrfToken},
                data: { product: this.product }
            })
                .then(response => {
                    // Product added to the cart.
                    if (response.data.success) {
                        window.location.href = `/?productAddedToCart=${this.product._id}`;
                    }
                })
                .catch(err => {
                    console.error(err);
                });
        },
        // Get image source 300 pixels.
        srcImgZoom(product, index){
            // let regExpResult = product.images[index].match(/\.[0-9a-z]+$/i);
            // console.debug(fileName);
            return '/img/' + product._id + '/' + product.images[index];
        },
        // Get image source 300 pixels.
        srcImg0300(product, index){
            let regExpResult = product.images[index].match(/\.[0-9a-z]+$/i);
            // console.debug(fileName);
            return '/img/' + product._id + '/' + product.images[index].slice(0, regExpResult.index) + '_0300px' + regExpResult[0]
        },
        // Get image source 80 pixels.
        srcImg0080(product, index){
            let regExpResult = product.images[index].match(/\.[0-9a-z]+$/i);
            // console.debug(fileName);
            return '/img/' + product._id + '/' + product.images[index].slice(0, regExpResult.index) + '_0080px' + regExpResult[0]
        },
        // Show zoom image.
        showZoomImg(){
            this.showModal = true;
        },
        // Hide zoom image.
        hideZoomImg(){
            this.showModal = false;
        },
        makeList(text) {
            let list = [];
            text = text.toString().trim();
            if (text == '') { return list; }
            text.split('\n').forEach(line=>{
                if (line.includes(';')) {
                    list.push(line.split(';'));
                } else {
                    list.push(line);
                }
            });
            // console.log(JSON.stringify(list[0], null, 2));
            return list;
        },
    },
    computed:{
        // Each line of product detail become one array item.
        productDetail(){
            if (this.product.storeProductDetail.trim() === '') {
                return new Array();
            }
            return this.product.storeProductDetail.split('\n');
        },
        // Each line become one array item.
        productDescription(){
            return this.makeList(this.product.storeProductDescription)
        },
        // Each line of technical information become a array item, each item in line separeted by ; become array item.
        productInformationTechnical(){
            return this.makeList(this.product.storeProductTechnicalInformation  )
        },
        // Each line of additional information become a array item, each item in line separeted by ; become array item.
        productInformationAdditional(){
            return this.makeList(this.product.storeProductAdditionalInformation  )
        }
    },
    filters: {
        currency(val){
            return val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        },
        currencyInt(val){
            return val.split(',')[0];
        },
        currencyCents(val){
            return val.split(',')[1];
        }
    },
});
