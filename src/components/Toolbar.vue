<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  visible: Boolean
})

const currentUserToolbar = computed(() => store.state.currentUserToolbar)
watch(() => currentUserToolbar.value, (value, prevValue) => {
  if (value) {
    store.dispatch('closeAllDialogs')
    store.dispatch('clearMultipleSelected')
  }
})

const currentUserToolbarIsBox = computed(() => {
  if (store.state.currentUserIsResizingBox) { return }
  return currentUserToolbar.value === 'box'
})
const boxBadgeLabel = computed(() => {
  let label = 'Draw Box (B)'
  return label
})
const toggleToolbar = (value) => {
  const initialValue = 'card'
  const shouldToggleOffBox = value === 'box' && currentUserToolbarIsBox.value
  if (shouldToggleOffBox) {
    store.dispatch('currentUserToolbar', initialValue)
  } else {
    store.dispatch('currentUserToolbar', value)
  }
}
const shouldIncreaseUIContrast = computed(() => store.state.currentUser.shouldIncreaseUIContrast)
</script>

<template lang="pug">
nav.toolbar(v-if="visible")
  //- Box
  .segmented-buttons
    .button-wrap(:title="boxBadgeLabel")
      button(
        :class="{ active: currentUserToolbarIsBox, 'translucent-button': !shouldIncreaseUIContrast }"
        @click="toggleToolbar('box')"
      )
        img.icon.box-icon(src="@/assets/box.svg")
        .label-badge.toolbar-badge-wrap.jiggle(v-if="currentUserToolbarIsBox")
          span {{boxBadgeLabel}}
</template>

<style lang="stylus">
.toolbar
  position absolute
  top 55px
  .toolbar-badge-wrap
    pointer-events none
    position absolute
    background-color var(--info-background)
    bottom -8px
    left 5px
    z-index 1
    width 77px
    span
      width 100%
      color var(--primary)
</style>
