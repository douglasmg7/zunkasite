<template lang='pug'>
  .menu
    ul
      // Home.
      li: a(href='/'): h4 Site
      // Store.
      li: a(href='store' v-bind:class='{"active": active === "store"}'): h4 Zunka
      // Allnations.
      li: a(href='allnations' v-bind:class='{"active": active === "allNations"}'): h4 All Nations
      // Create product.
    .space
    .search(v-if='active == "store"')
      button.ui.button(v-on:click='$emit("newProduct")') Criar Produto
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
  html, body, div, form, p
    margin: 0
    padding: 0
  .menu h4
    margin: .5em
  .menu a
    text-decoration: none
  ul
    display: inline-block
    list-style-type: none
    margin: 0
    padding: 0
    border: 1px solid green
  li
    display: inline-block
    border: 1px solid red
    padding: 0
  .space
    display: inline-block
    border: 1px solid yellow
  .search
    float: right
    border: 1px solid brown
  .user
    display: inline-block
    border: 1px solid brown

</style>
