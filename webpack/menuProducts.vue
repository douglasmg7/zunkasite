<template lang='pug'>
  ul
    li teste
    li 
      p teste2
    // Home.
    li: a(href='/'): h4 Site
    // Store.
    li: a(href='store' v-bind:class='{"active": active === "store"}'): h4 Zunka
    // Allnations.
    li: a(href='allnations' v-bind:class='{"active": active === "allNations"}'): h4 All Nations
    // Create product.
    //- div(v-if='active == "store"')
      button.ui.button(v-on:click='$emit("newProduct")') Criar Produto
      input(v-on:input='$emit("input", $event.target.value)' v-on:keypress='emitSearch($event)' v-model='searchText' placeholder='Pesquisa')
      i.search.link.icon(v-on:click='$emit("search")')
    //- div
      // User name.
      a(href='/users/account' v-if="this.user.username"): i {{this.user.username}}
      // Sign-in.
      a(href='/users/login' v-if="!this.user.username"): i Entrar
      // Exit.
      a(href='/users/logout' v-if="this.user.username"): i Sair
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
  ul
    list-style-type: none
    margin: 0
    padding: 0
    border: 1px solid
  li
    display: block-inline
    width: 80px
    border: 1px solid red
</style>
