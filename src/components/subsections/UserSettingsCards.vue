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

const props = defineProps({
  visible: Boolean,
  parentIsUserSettings: Boolean
})

const currentUser = computed(() => userStore.getUserAllState)
const closeChildDialogs = () => {}

// shift-enter

const shiftEnterShouldAddChildCard = computed(() => userStore.cardSettingsShiftEnterShouldAddChildCard)
const updateShiftEnter = (value) => {
  userStore.updateUser({ cardSettingsShiftEnterShouldAddChildCard: value })
}

//  max card width

const cardWrapWidth = computed(() => userStore.cardSettingsCardWrapWidth)
const cardWrapWidthIsNormal = computed(() => cardWrapWidth.value === consts.normalCardWrapWidth)
const cardWrapWidthIsWide = computed(() => cardWrapWidth.value === consts.wideCardWrapWidth)
const updateCardWrapWidthIsWide = (isWide) => {
  let value = consts.normalCardWrapWidth
  if (isWide) {
    value = consts.wideCardWrapWidth
  }
  userStore.updateUser({ cardSettingsCardWrapWidth: value })
  // server migration: cardSettingsCardWrapWidth -> cardSettingsCardWrapWidth
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
    p Card Wrap Width
    .segmented-buttons
      button(@click="updateCardWrapWidthIsWide(false)" :class="{ active: !cardWrapWidthIsWide }")
        span Normal
      button(@click="updateCardWrapWidthIsWide(true)" :class="{ active: cardWrapWidthIsWide }")
        span Wide
  section(v-if="parentIsUserSettings")
    .row
      p New Spaces
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
</style>
