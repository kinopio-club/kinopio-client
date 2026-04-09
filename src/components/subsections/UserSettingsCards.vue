<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import UserSettingsNewSpaces from '@/components/subsections/UserSettingsNewSpaces.vue'

import consts from '@/consts.js'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const customInputElement = ref(null)

const props = defineProps({
  visible: Boolean,
  parentIsUserSettings: Boolean
})

const state = reactive({
  customIsVisible: false
})

const currentUser = computed(() => userStore.getUserAllState)
const closeChildDialogs = () => {}

// shift-enter

const shiftEnterShouldAddChildCard = computed(() => userStore.cardSettingsShiftEnterShouldAddChildCard)
const updateShiftEnter = (value) => {
  userStore.updateUser({ cardSettingsShiftEnterShouldAddChildCard: value })
}
const optionKey = computed(() => utils.optionKey())
const optionKeyShortcut = computed(() => {
  if (shiftEnterShouldAddChildCard.value) {
    return 'Line Break'
  } else {
    return 'Child Card'
  }
})

//  max card width

const cardWrapWidth = computed(() => userStore.cardSettingsCardWrapWidth)
const cardWrapWidthIsNormal = computed(() => cardWrapWidth.value === consts.normalCardWrapWidth)
const cardWrapWidthIsWide = computed(() => cardWrapWidth.value === consts.wideCardWrapWidth)
const updateCardWrapWidth = (value) => {
  userStore.updateUser({ cardSettingsCardWrapWidth: value })
}

// custom card width

const focusCustomInput = () => {
  const element = customInputElement.value
  if (!element) { return }
  element.focus()
  element.setSelectionRange(0, 99999)
}
const customValue = computed({
  get () {
    return cardWrapWidth.value
  },
  set (newValue) {
    newValue = parseInt(newValue)
    newValue = newValue || consts.normalCardWrapWidth
    updateCardWrapWidth(newValue)
  }
})

</script>

<template lang="pug">
.cards-settings(v-if="visible")
  //- shift-enter
  section
    .row
      span Shift-Enter
    .segmented-buttons
      button(@click="updateShiftEnter(true)" :class="{ active: shiftEnterShouldAddChildCard }")
        span Child Card
      button(@click="updateShiftEnter(false)" :class="{ active: !shiftEnterShouldAddChildCard }")
        span Line Break
    .row
      span {{optionKey}}-Enter
      .badge.keyboard-shortcut {{optionKeyShortcut}}

  //- wrap width
  section
    .row
      span Card and List Wrap Width
    .segmented-buttons
      button(@click="updateCardWrapWidth(consts.normalCardWrapWidth, true)" :class="{ active: cardWrapWidthIsNormal }")
        span Normal
      button(@click="updateCardWrapWidth(consts.wideCardWrapWidth, true)" :class="{ active: cardWrapWidthIsWide }")
        span Wide
    //- input
    .row
      span.badge.secondary.input-badge
        input(
          type="number"
          :placeholder="200"
          v-model="customValue"
          ref="customInputElement"
          @keyup.space.prevent
          @keyup.backspace.stop
          @keyup.delete.stop
          @keyup.clear.stop
        )
        span px

  //- new spaces
  section(v-if="parentIsUserSettings")
    .row
      span New Spaces
    UserSettingsNewSpaces
</template>

<style lang="stylus">
.cards-settings
  overflow auto
  .current-color
    height 14px
    width 14px
    margin-bottom 1px
    border-radius var(--small-entity-radius)
    display inline-block
    vertical-align -3px
  .segmented-buttons + .row
    margin-top 10px
    .badge
      margin-left 6px
    .input-badge
      margin-left 0
      input
        width 55px
        margin-right 4px
</style>
