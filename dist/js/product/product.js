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
        outOfStockMessage: "Produto fora de estoque",
        loading: {
            show: false,
            message: 'Confirmando a disponibilidade do produto ',
        },
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
                // url:`/checkout/ship-estimate?productId=${this.product._id}&cepDestiny=${this.cepDestiny}`,
                url:`/checkout/estimate-freight?productId=${this.product._id}&cepDestiny=${this.cepDestiny}`,
                headers:{'csrf-token' : csrfToken},
                data: { productId: this.product._id, cepDestiny: this.cepDestiny }
            })
            .then(response => {
                // Server error.
                console.log(`response.data.freights: ${JSON.stringify(response.data.freights, null, 2)}`);
                if (response.data.err) {
                    console.error(response.data.err);
                    this.showEstimatedShipment = false;
                    this.cepErrMsg = 'Serviço indisponível';
                } 
                // No result.
                else if (response.data.freights.length == 0){
                    this.showEstimatedShipment = false;
                    this.cepErrMsg = 'Sem resultados para o CEP informado';
                } 
                // Some result.
                else {
                    this.cepErrMsg = '';
                    // console.log(`response.data.correio: ${JSON.stringify(response.data.correio)}`);
                    this.estimateShipmentData = [];
                    for (let index = 0; index < response.data.freights.length; index++) {
                        let deliveryData = {
                            service: response.data.freights[index].carrier,
                            price: response.data.freights[index].price,
                            time:  response.data.freights[index].deadline
                            // time:  `${response.data.freights[index].deadline} dia(s)`
                        };
                        this.estimateShipmentData.push(deliveryData);
                    }
                    this.showEstimatedShipment = true;
                }
                this.loadingEstimateShipment = false;
            })
            .catch(err => {
                console.error(err.stack);
                this.loadingEstimateShipment = false;
                this.showEstimatedShipment = false;
            });
        },
        // Add product to cart.
        addToCart(){
            // For aldo product, show loading message.
            if (this.product.dealerName === 'Aldo') {
                this.loading.show = true;
            }
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
                } else {
                    // Give time to hide modal-loading.
                    this.loading.show = false;
                    setTimeout(()=>{
                        if (response.data.outOfStock) {
                            this.outOfStockMessage = "Nossa última unidade acabou de ser vendida";
                            product.storeProductQtd = 0;
                        }
                        alert(response.data.message);
                    }, 200);
                }
            })
            .catch(err => {
                window.location.href=`/error?err=${err}`;
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
        },
        toDays(val){
            if (val == 1) {
                return val + ' dia';
            }
            return val + ' dias'
        }
    },
});
