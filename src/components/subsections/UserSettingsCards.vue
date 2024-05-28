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
const updateDefaultCharaterLimit = (value) => {
  store.dispatch('currentUser/update', { cardSettingsDefaultCharacterLimit: value })
}

// shift-enter

const shiftEnterShouldAddChildCard = computed(() => store.state.currentUser.cardSettingsShiftEnterShouldAddChildCard)
const updateShiftEnterShouldAddChildCard = (value) => {
  store.dispatch('currentUser/update', { cardSettingsShiftEnterShouldAddChildCard: value })
}

//  line wrap width

const lineWrapWidth = computed(() => store.state.currentUser.cardSettingsLineWrapWidth)
const updateLineWrapWidth = (value) => {
  store.dispatch('currentUser/update', { cardSettingsLineWrapWidth: value })
}

</script>

<template lang="pug">
.cards-settings(v-if="visible")
  section
    p Character Limit
    .segmented-buttons
      button.active
        span {{consts.maxCardLength}}
      button
        span {{consts.maxCodeBlockCardLength}}
  section
    p Shift-Enter
    .segmented-buttons
      button.active
        span Child Card
      button
        span Line Break
  section
    p Line Wrap Width
    .segmented-buttons
      button.active
        span {{consts.defaultCardMaxWidth}}
      button
        span 350
</template>

<style lang="stylus">
.cards-settings
  overflow auto
  section:not(.subsection)
    border-top 1px solid var(--primary-border)
    border-radius 0 !important
</style>
