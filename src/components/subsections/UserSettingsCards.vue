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
const updateLimit = (value) => {
  store.dispatch('currentUser/update', { cardSettingsDefaultCharacterLimit: value })
}

// shift-enter

const shiftEnterShouldAddChildCard = computed(() => store.state.currentUser.cardSettingsShiftEnterShouldAddChildCard)
const updateShiftEnter = (value) => {
  store.dispatch('currentUser/update', { cardSettingsShiftEnterShouldAddChildCard: value })
}

//  max card width

const maxCardWidthIsWide = computed(() => store.state.currentUser.cardSettingsMaxCardWidthIsWide)
const updateMaxCardWidthIsWide = (value) => {
  store.dispatch('currentUser/update', { cardSettingsMaxCardWidthIsWide: value })
}
</script>

<template lang="pug">
.cards-settings(v-if="visible")
  section
    p Shift-Enter
    .segmented-buttons
      button(@click="updateShiftEnter(true)" :class="{ active: shiftEnterShouldAddChildCard }")
        span Child Card
      button(@click="updateShiftEnter(false)" :class="{ active: !shiftEnterShouldAddChildCard }")
        span Line Break
  section
    p Character Limit
    .segmented-buttons
      button(@click="updateLimit(consts.maxCardCharacterLimit)" :class="{ active: limitIsDefault }")
        span {{consts.maxCardCharacterLimit}}
      button(@click="updateLimit(consts.maxCodeBlockCharacterLimit)" :class="{ active: limitIsMax }")
        span {{consts.maxCodeBlockCharacterLimit}}
  section
    p Max Card Width
    .segmented-buttons
      button(@click="updateMaxCardWidthIsWide(false)" :class="{ active: !maxCardWidthIsWide }")
        span Normal
      button(@click="updateMaxCardWidthIsWide(true)" :class="{ active: maxCardWidthIsWide }")
        span Wide
</template>

<style lang="stylus">
.cards-settings
  overflow auto
  section:not(.subsection)
    border-top 1px solid var(--primary-border)
    border-radius 0 !important
</style>
