var app = new Vue({
  el: '#app',
  data: {
    currentPage: 'product',
    banners: banners,
    user: user,
    search: '',
  },
  methods: {   
    // Save product.
    saveBanners(){
      axios({
        method: 'post',
        url: '/admin/banners',
        headers:{'csrf-token' : csrfToken},
        data: { banners: banners }
      })
      .then(response => {
        // Server side error.
        if (response.data.err) {
          alert('Não foi possível salvar.');
        }
      })
      .catch(err => {
        alert('Não foi possível salvar.');
        console.error(err);
      })       
    },
    moveImage(index, direction){
      // Position to move.
      let toIndex;
      // To right.
      if (direction === 'r') {
        // Last element.
        if ((index + 1) === this.banners.length) {
          toIndex = 0;
        // Not the last element.
        } else  {
          toIndex = index + 1;
        }
      // To left. 
      } else {
        // First element.
        if (index === 0) {
          toIndex = this.banners.length - 1;
        // Not the last element.
        } else  {
          toIndex = index - 1;
        } 
      }
      // Change elements.
      let toIndexElement = this.banners[toIndex];
      this.$set(this.banners, toIndex, this.banners[index]);
      this.$set(this.banners, index, toIndexElement);
    },
    // Delete image.
    deleteImage(index){
      this.$delete(this.banners, index);
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
          url: `/admin/upload-banner-images`,
          headers:{'csrf-token' : csrfToken},
          data: formData
        })
        .then(response => {
          // Include images on client.
          response.data.images.forEach(function(image){
            self.banners.push({ fileName: image, link: ''});
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