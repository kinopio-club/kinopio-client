<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
const store = useStore()

const dialog = ref(null)

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
dialog.narrow.upgrade-faq(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p Upgrade FAQ
  section.results-section
    details
      summary(@click="closeOtherDetails") What happens if I cancel my subscription?
      section.subsection
        p You'll always be able to view the cards and spaces that you create. But you won't be able to create new cards beyond the free limit.

    details
      summary(@click="closeOtherDetails") Is it easy to cancel?
      section.subsection
        p Yes. You can cancel anytime through User → Settings → Billing and Credits

    details
      summary(@click="closeOtherDetails") How long is the life plan?
      section.subsection
        p The life plan is a perpetual licence for as long as Kinopio operates. Which will be for many years, likely decades.
</template>

<style lang="stylus">
.upgrade-faq
  left initial
  right 4px
  overflow auto
  max-height 350px
  .results-section
    border-top 1px solid var(--primary-border)
    padding-top 4px
</style>
