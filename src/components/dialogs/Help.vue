<script setup>
// import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  visible: Boolean
})
</script>

<template lang="pug">
dialog.help.narrow(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    .row
      a(href="https://help.kinopio.club")
        button
          span Help Topics{{' '}}
          img.icon.visit(src="@/assets/visit.svg")
    .row
      .button-wrap
        a(href="https://help.kinopio.club/about")
          button
            span About{{' '}}
            img.icon.visit(src="@/assets/visit.svg")
      .button-wrap
        a(href="https://help.kinopio.club/api/")
          button
            span API{{' '}}
            img.icon.visit(src="@/assets/visit.svg")
  section
    .row
      a(href="https://help.kinopio.club/posts/terms-of-service/")
        button
          span Terms of Service{{' '}}
          img.icon.visit(src="@/assets/visit.svg")
    .row
      a(href="https://help.kinopio.club/posts/privacy-policy")
        button
          span Privacy Policy{{' '}}
          img.icon.visit(src="@/assets/visit.svg")
    //- img.froggo(src="@/assets/froggo.png")

  //- section
  //-   .button-wrap
  //-     a(href="https://twitter.com/kinopioclub")
  //-       button
  //-         span Instagram{{' '}}
  //-         img.icon.visit(src="@/assets/visit.svg")

    //- .button-wrap
    //-   a(href="https://twitter.com/kinopioclub")
    //-     button
    //-       span Twitter{{' '}}
    //-       img.icon.visit(src="@/assets/visit.svg")

</template>

<style lang="stylus">
dialog.help
  &.narrow
    width 180px
</style>
