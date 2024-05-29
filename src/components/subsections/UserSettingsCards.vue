<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import consts from '@/consts.js'
import utils from '@/utils.js'

const store = useStore()

onMounted(() => {
  initDefaultColor()
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerUpdateTheme') {
      initDefaultColor()
    }
  })
})

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  colorPickerIsVisible: false,
  defaultColor: '#e3e3e3'
})
const initDefaultColor = () => {
  state.defaultColor = utils.cssVariable('secondary-background')
}

const currentUser = computed(() => store.state.currentUser)

// character limit

const defaultCharacterLimit = computed(() => store.state.currentUser.cardSettingsDefaultCharacterLimit)
const limitIsDefault = computed(() => !defaultCharacterLimit.value || defaultCharacterLimit.value === consts.defaultCharacterLimit)
const limitIsMax = computed(() => defaultCharacterLimit.value === consts.highCharacterLimit)
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
const maxCardWidthIsNormal = computed(() => maxCardWidth.value === consts.normalCardMaxWidth)
const maxCardWidthIsWide = computed(() => maxCardWidth.value === consts.wideCardMaxWidth)
const updateMaxCardWidthIsWide = (isWide) => {
  let value = consts.normalCardMaxWidth
  if (isWide) {
    value = consts.wideCardMaxWidth
  }
  store.dispatch('currentUser/update', { cardSettingsMaxCardWidth: value })
}

// card color

const updateDefaultCardColor = (color) => {
  store.dispatch('currentUser/update', { defaultCardBackgroundColor: color })
}
const removeDefaultCardColor = () => {
  updateDefaultCardColor(null)
  closeChildDialogs()
}
const toggleColorPicker = () => {
  const value = !state.colorPickerIsVisible
  closeChildDialogs()
  state.colorPickerIsVisible = value
}
const closeChildDialogs = () => {
  state.colorPickerIsVisible = false
}
const defaultCardColor = computed(() => {
  const userDefault = currentUser.value.defaultCardBackgroundColor
  return userDefault || state.defaultColor
})
const userHasDefaultCardColor = computed(() => {
  const systemDefaultColor = utils.cssVariable('secondary-background')
  const userDefaultColor = currentUser.value.defaultCardBackgroundColor
  const defaultColorIsNotSystem = userDefaultColor !== systemDefaultColor
  return userDefaultColor && defaultColorIsNotSystem
})

</script>

<template lang="pug">
.cards-settings(v-if="visible" @click.left.stop="closeChildDialogs")
  section
    .row
      p New Card Color
    .row
      .button-wrap
        .segmented-buttons
          button(@click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible || userHasDefaultCardColor}")
            .current-color(:style="{ 'background-color': defaultCardColor }")
          button(@click.left.stop="removeDefaultCardColor")
            img.icon.cancel(src="@/assets/add.svg")
        ColorPicker(:currentColor="defaultCardColor" :visible="state.colorPickerIsVisible" @selectedColor="updateDefaultCardColor")
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
      button(@click="updateLimit(consts.defaultCharacterLimit)" :class="{ active: limitIsDefault }")
        span {{consts.defaultCharacterLimit}}
      button(@click="updateLimit(consts.highCharacterLimit)" :class="{ active: limitIsMax }")
        span {{consts.highCharacterLimit}}
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
  // overflow auto
  section:not(.subsection)
    border-top 1px solid var(--primary-border)
    border-radius 0 !important
  .current-color
    height 14px
    width 14px
    margin-bottom 1px
    border-radius var(--small-entity-radius)
    display inline-block
    vertical-align -3px

</style>
