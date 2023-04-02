<script setup>
import ReferredNewUserCredits from '@/components/ReferredNewUserCredits.vue'
import consts from '@/consts.js'

import { reactive, computed, onMounted, defineProps, defineEmits } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  visible: Boolean
})

</script>

<template lang="pug">
dialog.narrow.pricing(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p Kinopio is free for 100 cards, afterwards it's ${{consts.priceMonthly}}/month, ${{consts.priceYearly}}/year, or ${{consts.priceLife}}/life
    ReferredNewUserCredits()
    table
      tbody
        tr.table-header
          td
            span Free
          td
            span.badge.success Upgraded
        tr
          td 100 Cards
          td Unlimited Cards
        tr
          td 5mb file upload size limit
          td No upload limit
        tr
          td 10 AI images
          td 50 AI images/mo

  section
    p Hi, my name is Pirijan and I'm the creator of Kinopio.
    p I believe in building ethical, economically-sustainable,
      span {{' '}}
      a(href="https://pketh.org/organic-software.html") organic software
      span {{' '}}
      span that's designed by artists, built by craftspeople, and funded by the people who enjoy it.
</template>

<style lang="stylus">
.pricing
  top calc(100% - 8px)
  left initial
  right 8px
  max-height calc(100vh - 25px)
  p
    user-select text
</style>
