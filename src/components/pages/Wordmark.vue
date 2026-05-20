<script setup>
// const props = defineProps({
//   visible: Boolean
// })
</script>

<template lang="pug">
h1.wordmark KINOPIO
</template>

<style lang="stylus">
:root
  --wordmark-font baustrabe, var(--sans-serif-font)
@font-face
  font-family 'baustrabe'
  src url("@/assets/fonts/baustrabe/Baustraßev0.8-Bold.woff2") format("woff2")
  font-weight bold
  font-style normal
@font-face
  font-family 'baustrabe'
  src url("@/assets/fonts/baustrabe/Baustraßev0.8-BoldOblique.woff2") format("woff2")
  font-weight bold
  font-style italic

h1.wordmark
  font-family var(--wordmark-font)
  font-size 55px
  margin-block initial
  margin-bottom 1rem
  font-style italic
</style>
