<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

// import utils from '@/utils.js'
const store = useStore()

const props = defineProps({
  visible: Boolean
})

const closeOtherDetails = (event) => {
  const summaries = document.querySelectorAll('summary')
  const target = event.target
  summaries.forEach(summary => {
    if (summary !== target) {
      const details = summary.closest('details')
      details.removeAttribute('open')
    }
  })
}
</script>

<template lang="pug">
dialog.narrow.free-limit-faq(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p Free Limit FAQ
  section.results-section
    details
      summary(@click="closeOtherDetails") How are cards counted?
      section.subsection
        p Cards you add will increment the card count. Cards you remove will decrement the card count.

    details
      summary(@click="closeOtherDetails") What happens when I run out of free cards?
      section.subsection
        p You'll always have access to your cards and spaces. But you won't be able to create new cards unless you remove some to decrease your card count.

</template>

<style lang="stylus">
.free-limit-faq
  left initial
  top -120px !important
  right 2px
  .results-section
    border-top 1px solid var(--primary-border)
    padding-top 4px
</style>
