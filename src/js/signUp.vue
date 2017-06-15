<template lang='pug'>
  div
    h3.ui.dividing.header Cadastrar usuario
    form.ui.form(action='/users/signup' method='post')
      .field
        label Usuario
        input(type='text' name='username' v-model='username')
      .field
        label Senha
        input(type='password' name='password' v-model='password')
      .ui.center.aligned.container
        .field
          input.ui.button(type='submit' value='Cadastrar')
</template>
<script>
  /* globals accounting */
  'use strict';
  export default {
    data: function(){
      return {
        username:'',
        password: ''
      }
    }
  }
</script>
<style lang='stylus'>
</style>
