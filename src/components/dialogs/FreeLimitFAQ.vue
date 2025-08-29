<script setup>
import { reactive, computed, onMounted, watch, ref, nextTick } from 'vue'

// import utils from '@/utils.js'

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
      summary(@click="closeOtherDetails") How are spaces counted?
      section.subsection
        p Spaces you create will increment the count. Spaces you remove will decrement the count. The ‘Inbox’ and ‘Hello Kinopio’ spaces are not counted.

    details
      summary(@click="closeOtherDetails") What happens when I run out of free spaces?
      section.subsection
        p You'll always have access to your spaces. But you won't be able to create new ones unless you upgrade or remove spaces to decrease your count.

</template>

<style lang="stylus">
.free-limit-faq
  left initial
  .results-section
    border-top 1px solid var(--primary-border)
    padding-top 4px
</style>
