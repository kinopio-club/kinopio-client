<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import consts from '@/consts.js'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const props = defineProps({
  visible: Boolean
})

const currentUser = computed(() => userStore.getUserAllState)
const closeChildDialogs = () => {}

// shift-enter

const shiftEnterShouldAddChildCard = computed(() => userStore.cardSettingsShiftEnterShouldAddChildCard)
const updateShiftEnter = (value) => {
  userStore.updateUser({ cardSettingsShiftEnterShouldAddChildCard: value })
}

//  max card width

const maxCardWidth = computed(() => userStore.cardSettingsMaxCardWidth)
const maxCardWidthIsNormal = computed(() => maxCardWidth.value === consts.normalCardMaxWidth)
const maxCardWidthIsWide = computed(() => maxCardWidth.value === consts.wideCardMaxWidth)
const updateMaxCardWidthIsWide = (isWide) => {
  let value = consts.normalCardMaxWidth
  if (isWide) {
    value = consts.wideCardMaxWidth
  }
  userStore.updateUser({ cardSettingsMaxCardWidth: value })
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
  .current-color
    height 14px
    width 14px
    margin-bottom 1px
    border-radius var(--small-entity-radius)
    display inline-block
    vertical-align -3px
</style>
