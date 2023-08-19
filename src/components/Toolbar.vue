<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'currentUserToolbar') {
      store.dispatch('closeAllDialogs')
      store.dispatch('clearMultipleSelected')
    }
  })
})

const props = defineProps({
  visible: Boolean
})

const visible = computed(() => props.visible && canEditSpace.value)
const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())

// toolbar state

const currentUserToolbar = computed(() => store.state.currentUserToolbar)
const currentUserToolbarIsBox = computed(() => {
  if (store.state.currentUserIsResizingBox) { return }
  return store.state.currentUserToolbar === 'box'
})
const toggleToolbar = (value) => {
  const initialValue = 'card'
  const shouldToggleOffBox = value === 'box' && currentUserToolbarIsBox.value
  if (shouldToggleOffBox) {
    store.commit('currentUserToolbar', initialValue)
  } else {
    store.commit('currentUserToolbar', value)
  }
}

// line

const addLine = () => {
  store.dispatch('closeAllDialogs')
  store.dispatch('clearMultipleSelected')
  store.dispatch('currentLines/add', { y: 200 })
}

</script>

<template lang="pug">
nav.toolbar(v-if="visible")
  .segmented-buttons.vertical
    //- Box
    button(:class="{ active: currentUserToolbarIsBox }" @click="toggleToolbar('box')" title="Add Box (B)")
      img.icon.box-icon(src="@/assets/box.svg")
      .label-badge.toolbar-badge-wrap.jiggle(v-if="currentUserToolbarIsBox")
        span Add Box (B)
    //- Line
    button(@click="addLine" title="Add Line (L)")
      img.icon(src="@/assets/line.svg")
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
