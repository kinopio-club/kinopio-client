<script setup>
const props = defineProps({
  h2: String
})
</script>

<template lang="pug">
.row.wordmark
    h1 KINOPIO
    h2(v-if="props.h2") {{ props.h2 }}
</template>

<style lang="stylus" scoped>
.wordmark
  display flex
  word-wrap no-wrap
  margin-bottom 1rem
  align-items flex-start
  h1
    font-family var(--header-font-9)
    font-size 54px
    margin-block initial
    font-style italic
  h2
    font-family var(--header-font-5)
    font-size 20px
    width 50px
    margin 0
    margin-left 1.5rem
    line-height 20px
    transform translateY(11px)
  @media(max-width 500px)
    h1
      font-size 40px
    h2
      font-size 16px
      line-height 16px
      transform translateY(7px)
      margin-left 1.4rem
</style>
