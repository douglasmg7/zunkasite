<template lang='pug'>
  .ui.menu
    a.item(href='store' v-bind:class='{"active": active === "store"}') Hard Plus
    a.item(href='allnations' v-bind:class='{"active": active === "allNations"}') All Nations
    a.item(href='lojasamericanas' v-bind:class='{"active": active === "lojasAmericanas"}') Lojas Americanas
    .right.menu
      .item
        .ui.icon.input
          input(v-on:input='$emit("input", $event.target.value)' v-on:keypress='emitSearch($event)' v-model='searchText' placeholder='Pesquisa')
          i.search.link.icon(v-on:click='$emit("search")')
          //- input(v-model='searchText' v-on:keypress='emitSearch($event)' placeholder='Pesquisa')
          //- i.search.link.icon(v-on:click='$emit("search", searchText)')
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
    props: [
      'active'
    ],
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
