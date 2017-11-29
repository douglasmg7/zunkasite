<template lang='pug'>
  .menu
    ul
      // Home.
      li: a(href='/') Site
      // Store.
      li: a(href='store' v-bind:class='{"active": active === "store"}') Loja
      // Allnations.
      li: a(href='allnations' v-bind:class='{"active": active === "allNations"}') All Nations      
      li: button.create-product Criar produto

      
    //- button.search(v-on:click='$emit("newProduct")') Criar Produto
  //- .search(v-if='active == "store"')
    input(v-on:input='$emit("input", $event.target.value)' v-on:keypress='emitSearch($event)' v-model='searchText' placeholder='Pesquisa')
    i.search.link.icon(v-on:click='$emit("search")')
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
  html, body, div, form, ul, li
    margin: 0
    padding: 0
  .menu
    background-color: black
  .menu a
    font-size: 1.2em
    color: #ccc
    text-decoration: none
  .menu a:hover
    color: #fff
  button.create-product
    margin: 0
    padding: 0
    font-size: 1em  
  ul
    display: inline-block
    list-style-type: none
  li
    display: inline-block
    margin: .4em 1em .4em 1em
    // border: 4px solid red
</style>
