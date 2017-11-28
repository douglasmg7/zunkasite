<template lang='pug'>
  .menu
    ul
      // Home.
      li: a(href='/') Site
      // Store.
      li: a(href='store' v-bind:class='{"active": active === "store"}') h4
      // Allnations.
      li: a(href='allnations' v-bind:class='{"active": active === "allNations"}') All Nations
    // Create product.
    button.ui.button(v-on:click='$emit("newProduct")') Criar Produto
    .test
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
  html, body, div, form, p
    margin: 0
    padding: 0
  .menu
    background-color: black
    border: 4px solid green
  .menu a
    font-size: 3.5em
    color: #ccc
    text-decoration: none
    padding: .5em
  .menu a:hover
    color: #fff
  .menu button
    margin: auto
    padding: 0
    font-size: 1em
    // display: inline-block
    // vertical-align: middle
    position: relative
    // top: 50%
    // transform: translateY(-10%)
    color: red
  .test
    display: inline-block
    width: 2em
    height: 2em
    background-color: blue
  ul
    display: inline-block
    list-style-type: none
    margin: 0
    padding: 0
    border: 4px solid yellow
  li
    display: inline-block
    border: 4px solid red
    padding: 0
</style>
