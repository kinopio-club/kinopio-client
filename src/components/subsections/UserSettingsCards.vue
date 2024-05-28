<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import consts from '@/consts.js'
const store = useStore()

const props = defineProps({
  visible: Boolean
})

// character limit

const defaultCharacterLimit = computed(() => store.state.currentUser.cardSettingsDefaultCharacterLimit)
const limitIsDefault = computed(() => !defaultCharacterLimit.value || defaultCharacterLimit.value === consts.maxCardCharacterLimit)
const limitIsMax = computed(() => defaultCharacterLimit.value === consts.maxCodeBlockCharacterLimit)
const updateDefaultCharaterLimit = (value) => {
  store.dispatch('currentUser/update', { cardSettingsDefaultCharacterLimit: value })
}

// shift-enter

const shiftEnterShouldAddChildCard = computed(() => store.state.currentUser.cardSettingsShiftEnterShouldAddChildCard)
const updateShiftEnterShouldAddChildCard = (value) => {
  store.dispatch('currentUser/update', { cardSettingsShiftEnterShouldAddChildCard: value })
}

//  max card width

const maxCardWidth = computed(() => store.state.currentUser.cardSettingsMaxCardWidth)
const maxCardWidthIsDefault = computed(() => !maxCardWidth.value || maxCardWidth.value === consts.defaultCardMaxWidth)
const maxCardWidthIsWide = computed(() => maxCardWidth.value === 350)
const updateMaxCardWidth = (value) => {
  store.dispatch('currentUser/update', { cardSettingsMaxCardWidth: value })
}
</script>

<template lang="pug">
.cards-settings(v-if="visible")
  section
    p Character Limit
    .segmented-buttons
      button(:class="{ active: limitIsDefault }")
        span {{consts.maxCardCharacterLimit}}
      button(:class="{ active: limitIsMax }")
        span {{consts.maxCodeBlockCharacterLimit}}
  section
    p Shift-Enter
    .segmented-buttons
      button(:class="{ active: shiftEnterShouldAddChildCard }")
        span Child Card
      button(:class="{ active: !shiftEnterShouldAddChildCard }")
        span Line Break
  section
    p Max Card Width
    .segmented-buttons
      button(:class="{ active: maxCardWidthIsDefault }")
        span {{consts.defaultCardMaxWidth}}
      button(:class="{ active: maxCardWidthIsWide }")
        span 350
</template>

<style lang="stylus">
.cards-settings
  overflow auto
  section:not(.subsection)
    border-top 1px solid var(--primary-border)
    border-radius 0 !important
</style>
