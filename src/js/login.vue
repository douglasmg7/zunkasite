<template lang='pug'>
  div
    //- .ui.black.inverted.attached.stackable.menu
    .ui.black.inverted.borderless.attached.stackable.menu
      .ui.container
        a.ui.link.item(href='/')
          i.big.home.icon Zunka
        .ui.right.item
          label {{user}}
    //- .ui.center.aligned.container
    .ui.left.aligned.container
      .ui.basic.padded.segment
        //- form.ui.form
        .ui.basic.segment
          //- detalhes
          h3.ui.dividing.header Login
          form.ui.form(action='/users/login' method='post')
            .field
              label username
              input(type='text' name='username' v-model='username')
              //- input(v-model='email')
            .field
              label password
              input(type='password' name='password' v-model='password')
              //- input(v-model='password')
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
        password: '',
        user: 'no user'
      }
    },
    created() {
    },
    methods: {
      // retrive products page
      login(email, password){
        this.$http.post(`login`, {email: email, password: password})
          .then(res=>{
            console.log(res.body);
            // if (res.body.success) {
            //   sessionStorage.token = res.body.token
            //   this.user = res.body.user;
            // } else {
            //   delete sessionStorage.token;
            //   this.user = 'no user';
            // }
          })
          .catch(err=>{
            console.log(`Error - login, err: ${JSON.stringify(err)}`);
          });
      },
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
      },
      LogOut(){
        this.$http.post(`logout`)
          .then((res)=>{
            console.log(res.body);
          })
          .catch((err)=>{
            console.log(`Error - logout(), err: ${err}`);
          });
      }
    }
  }
</script>
<style lang='stylus'>
</style>
