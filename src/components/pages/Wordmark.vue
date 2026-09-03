<script setup>
const props = defineProps({
  h2: String,
  isH1: Boolean // false for article pages
})
</script>

<template lang="pug">
.row.wordmark
  h1.name(v-if="props.isH1") KINOPIO
  .name(v-else) KINOPIO

  h2(v-if="props.h2") {{ props.h2 }}
</template>

<style lang="stylus" scoped>
.wordmark
  display flex
  word-wrap no-wrap
  margin-bottom 1rem
  align-items flex-start
  .name
    font-family var(--header-font-9)
    font-size 54px
    margin-block initial
    font-style italic
    font-weight bold
  h2
    font-family var(--header-font-5)
    font-size 20px
    width 50px
    margin 0
    margin-left 1.5rem
    line-height 20px
    transform translateY(11px)
  @media(max-width 500px)
    .name
      font-size 40px
    h2
      font-size 16px
      line-height 16px
      transform translateY(7px)
      margin-left 1.4rem
</style>
