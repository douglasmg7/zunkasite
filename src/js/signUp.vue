<template lang='pug'>
  div
    .ui.black.inverted.borderless.attached.stackable.menu
      .ui.container
        a.ui.link.item(href='/')
          i.big.home.icon Zunka
    .ui.left.aligned.container
      .ui.basic.padded.segment
        .ui.basic.segment
          h3.ui.dividing.header Dados cadastrais
          form.ui.form(action='/users/signup' method='post')
            .field
              label e-mail
              input(type='text' name='username' v-model='username')
              //- input(v-model='email')
            .field
              label Senha
              input(type='password' name='password' v-model='password')
              //- input(v-model='password')
            .field
              input.ui.button(type='submit' value='Cadastrar')
</template>
<script>
  /* globals accounting */
  'use strict';
  export default {
    components: {
    },
    data: function(){
      return {
        username:'',
        password: '',
        user: 'no user'
      }
    },
    created() {
    }
    // methods: {
    //   // signUp(username, password){
    //   //   this.$http.post(`sign-up`, {username: username, password: password})
    //   //     .then((res)=>{
    //   //       console.log(res.body);
    //   //       console.log(res.username);
    //   //       console.log(res.password);
    //   //     })
    //   //     .catch((err)=>{
    //   //       console.log(`Error - login(), err: ${err}`);
    //   //     });
    //   }
    // }
  }
</script>
<style lang='stylus'>
</style>
