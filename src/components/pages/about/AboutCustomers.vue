<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import UserLabelInline from '@/components/UserLabelInline.vue'
// import { useThemeStore } from '@/stores/useThemeStore'

// const themeStore = useThemeStore()

// const isThemeDark = computed(() => themeStore.getIsThemeDark)
</script>

<template lang="pug">
section.customers
  //- details
  //-   summary
  .customer
    UserLabelInline(:user="{id: 1, name: 'Maria', color: 'purple'}")
    span "I presented a Kinopio board to my students instead of a slideshow, and they were taking pictures of it. It’s been the talk of the town/class. Thanks again for the joy!"

  //- p But it's the{{' '}}
  //-   a(href="https://kinopio.club/love-wall-4Ry3Xwo8Giy7Jeul-s2TY") love from customers
  //-   span {{' '}}that means the most to me.

</template>

<style lang="stylus">
section.customers
  display flex

  .user-label-inline-wrap
    vertical-align 1px
  .customer
    max-width 200px
</style>
