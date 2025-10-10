<script setup>
// import utils from '@/utils.js'

import { reactive, computed, onMounted, watch, ref, nextTick } from 'vue'

const props = defineProps({
  visible: Boolean
})
</script>

<template lang="pug">
dialog.help.narrow(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section.title-section
    .row
      a(href="https://help.kinopio.club")
        button
          span Help and Tutorials{{' '}}
          img.icon.visit(src="@/assets/visit.svg")
  section
    .row
      a(href="mailto:support@kinopio.club")
        button
          img.icon(src="@/assets/mail.svg")
          span Email Support
  section
    .row
      .button-wrap
        a(href="https://help.kinopio.club/api/")
          button
            img.icon(src="@/assets/system.svg")
            span API Docs{{' '}}
            img.icon.visit(src="@/assets/visit.svg")
  section
    .row
      a(href="https://help.kinopio.club/posts/privacy-policy")
        button
          span Privacy Policy{{' '}}
          img.icon.visit(src="@/assets/visit.svg")
    .row
      a(href="https://help.kinopio.club/posts/terms-of-service/")
        button
          span Terms of Service{{' '}}
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
