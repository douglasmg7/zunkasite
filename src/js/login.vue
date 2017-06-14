<template lang='pug'>
  div
    h3.ui.dividing.header Login
    form.ui.form(action='/users/login' method='post')
      .field
        label Usuario
        input(type='text' name='username' v-model='username')
      .field
        label Senha
        input(type='password' name='password' v-model='password')
      .ui.center.aligned.container
        .field
          input.ui.button(type='submit' value='Log In')
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
        password: ''
      }
    },
    created() {
    },
    methods: {
      signUp(username, password){
        this.$http.post(`sign-up`, {username: username, password: password})
          .then((res)=>{
            console.log(res.body);
            console.log(res.username);
            console.log(res.password);
          })
          .catch((err)=>{
            console.log(`Error - login(), err: ${err}`);
          });
      }
    }
  }
</script>
<style lang='stylus'>
</style>
