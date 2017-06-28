<template lang='pug'>
  .ui.menu
    // Home.
    a.ui.link.item(href='/')
      h4 Site
    a.item(href='store' v-bind:class='{"active": active === "store"}') 
      h4 Zunka
    a.item(href='allnations' v-bind:class='{"active": active === "allNations"}')  
      h4 All Nations
    .right.menu
      .item(v-if='active == "store"')
        button.ui.button(v-on:click='$emit("newProduct")') Criar Produto
      .item
        .ui.icon.input
          input(v-on:input='$emit("input", $event.target.value)' v-on:keypress='emitSearch($event)' v-model='searchText' placeholder='Pesquisa')
          i.search.link.icon(v-on:click='$emit("search")')
          //- input(v-model='searchText' v-on:keypress='emitSearch($event)' placeholder='Pesquisa')
          //- i.search.link.icon(v-on:click='$emit("search", searchText)')
      // User name.
      .ui.item
        i.large.user.icon(v-if="this.user.username") 
        | {{this.user.username}}
      // Sign-in.
      a.ui.item(href='/users/login' v-if="!this.user.username")
        i.large.icon.sign.in
        | Entrar
      // Exit.
      //- a.ui.item(:href='host("/users/logout")' v-if="this.user.username")
      a.ui.item(href='/users/logout' v-if="this.user.username")
        i.large.sign.out.icon
        | Sair            
</template>

<script>
  'use strict';
  export default {
    data: function(){
      return {
        msg: 'Menu Products',
        searchText: ''
      }
    },
    props: [ 'active', 'user'],
    methods: {
      emitSearch(event){
        // enter key pressed, make search
        if (event.keyCode == 13) {this.$emit('search');}
        // esc key pressed, clean search
        if (event.keyCode == 27) {this.searchText=''; this.$emit('input', ''); this.$emit('search');}
      }
        // emitSearch(event){
        //   // enter key pressed, make search
        //   if (event.keyCode == 13) {this.$emit('search', this.searchText);}
        //   // esc key pressed, clean search
        //   if (event.keyCode == 27) {this.searchText=''; this.$emit('search', this.searchText);}
        // }
    }
  }
</script>

<style lang='stylus'>

</style>
