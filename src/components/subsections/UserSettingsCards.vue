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

const maxCardWidth = computed(() => store.state.currentUser.cardSettingsMaxCardWidth)
const maxCardWidthIsDefault = computed(() => !maxCardWidth.value || maxCardWidth.value === consts.defaultCardMaxWidth)
const maxCardWidthIsWide = computed(() => maxCardWidth.value === consts.wideCardMaxWidth)
const updateMaxCardWidth = (value) => {
  store.dispatch('currentUser/update', { cardSettingsMaxCardWidth: value })
}
</script>

<template lang="pug">
.cards-settings(v-if="visible")
  section
    p Character Limit
    .segmented-buttons
      button(@click="updateLimit(consts.maxCardCharacterLimit)" :class="{ active: limitIsDefault }")
        span {{consts.maxCardCharacterLimit}}
      button(@click="updateLimit(consts.maxCodeBlockCharacterLimit)" :class="{ active: limitIsMax }")
        span {{consts.maxCodeBlockCharacterLimit}}
  section
    p Shift-Enter
    .segmented-buttons
      button(@click="updateShiftEnter(true)" :class="{ active: shiftEnterShouldAddChildCard }")
        span Child Card
      button(@click="updateShiftEnter(falsez)" :class="{ active: !shiftEnterShouldAddChildCard }")
        span Line Break
  section
    p Max Card Width
    .segmented-buttons
      button(@click="updateMaxCardWidth(consts.defaultCardMaxWidth)" :class="{ active: maxCardWidthIsDefault }")
        span {{consts.defaultCardMaxWidth}}
      button(@click="updateMaxCardWidth(consts.wideCardMaxWidth)" :class="{ active: maxCardWidthIsWide }")
        span consts.wideCardMaxWidth
</template>

<style lang="stylus">
.cards-settings
  overflow auto
  section:not(.subsection)
    border-top 1px solid var(--primary-border)
    border-radius 0 !important
</style>
