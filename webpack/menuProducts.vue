<template lang='pug'>
  .menu
    ul
      // Home.
      li: a(href='/') Site
      // Store.
      li: a(href='store' v-bind:class='{"active": active === "store"}') Loja
      // Allnations.
      li: a(href='allnations' v-bind:class='{"active": active === "allNations"}') All Nations      
    button(v-on:click='$emit("newProduct")') Criar Produto
    .search(v-if='active == "store"')
      input(v-on:input='$emit("input", $event.target.value)' v-on:keypress='emitSearch($event)' v-model='searchText' placeholder='Pesquisa')
      input(v-on:click='$emit("search")')
      // svg.icon: use(xlink:href='/icon/sprite.svg#ic_account_circle_white_24px') 
      // i.search.link.icon(v-on:click='$emit("search")')
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
  button, input
    box-sizing: border-box
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
  .menu button
    height: 2em
    margin: .3em
  .search input:first-child
    height: 2em
    min-width: 15em
    margin: .2em 0em .2em 5em
    border: none
    border-radius: 4px 0 0 4px;
    padding-left: .5em
  .search input:last-child
    height: 2em
    width: 2.2em
    border: none
    border-radius: 0 4px 4px 0;
    // background: url('/icon/sprite.svg#ic_search_black_24px') no-repeat;
    // background-image: url('/icon/sprite.svg#ic_search_black_24px')
    // background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="/icon/sprite.svg#ic_search_black_24px"></use></svg>')
    background-image: url('/icon/ic_search_black_24px.svg')
    background-repeat: no-repeat
    background-color: white
    background-size: 1.8em 1.8em;
    background-position: 65% 50%;  
  .search input:last-child:hover
    background-color: lightgray
    cursor: pointer
  .account
    margin-left: auto
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
