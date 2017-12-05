<template lang='pug'>
  .menu
    ul
      // Home.
      li: a(href='/') Site
      // Store.
      li: a(href='store' v-bind:class='{"active": active === "store"}') Loja
      // Allnations.
      li: a(href='allnations' v-bind:class='{"active": active === "allNations"}') All Nations      
    button.search(v-on:click='$emit("newProduct")') Criar Produto
    .search(v-if='active == "store"')
      input(v-on:input='$emit("input", $event.target.value)' v-on:keypress='emitSearch($event)' v-model='searchText' placeholder='Pesquisa')
      i.search.link.icon(v-on:click='$emit("search")')
    .account
      // User name.
      a(href='/users/account' v-if="this.user.name")
        svg.icon: use(xlink:href='/icon/sprite.svg#ic_account_circle_white_24px') 
        | {{this.user.name}}
      // Exit.
      a(href='/users/logout')
        svg.icon: use(xlink:href='/icon/sprite.svg#ic_exit_to_app_white_24px')
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
  html, body, div, form, ul, li
    margin: 0
    padding: 0
  .menu
    font-size: 1em
    display: flex
    flex-flow: row wrap
    align-items: center
    background-color: black
  .menu a
    color: #ccc
    text-decoration: none
    margin: .4em 1em .4em 1em
  .menu a:hover
    color: #fff
  .menu input
    margin: .2em 1em .2em 5em
  .account
    display: flex
    flex-flow: row wrap
  ul
    list-style-type: none
  li
    display: inline-block
  .icon {
    width: 1.5em
    height: 1.5em
    vertical-align: middle
    margin-right: .5em
  }      
</style>
