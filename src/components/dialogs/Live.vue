<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import SpaceList from '@/components/SpaceList.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const spaceStore = useSpaceStore()

const dialogElement = ref(null)
const resultsElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
})

const props = defineProps({
  visible: Boolean,
  spaces: Array,
  loading: Boolean
})
const state = reactive({
  dialogHeight: null,
  resultsSectionHeight: null
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
    updateResultsSectionHeight()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeightFromHeader(element)
}
const updateResultsSectionHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = resultsElement.value
  state.resultsSectionHeight = utils.elementHeightFromHeader(element, true)
}

const parentDialog = computed(() => 'live')
const changeSpace = (space) => {
  spaceStore.changeSpace(space)
}
</script>

<template lang="pug">
dialog.live(v-if="props.visible" :open="props.visible" ref="dialog" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p
      img.icon.camera.blink(src="@/assets/camera.svg")
      span Live Public Spaces
      Loader(:visible="props.loading")
  section.results-section.results-section-border-top(v-if="props.spaces.length" ref="results" :style="{'max-height': state.resultsSectionHeight + 'px'}")
    SpaceList(
      :spaces="props.spaces"
      :showOtherUsers="true"
      :hideExploreBadge="true"
      @selectSpace="changeSpace"
      :resultsSectionHeight="state.resultsSectionHeight"
      :parentDialog="parentDialog"
      :previewImageIsWide="true"
      :hideFilter="true"
    )
  section.empty(v-if="!props.spaces.length")
    p No public spaces are currently being edited, check back soon
    img.placeholder(src="@/assets/cat-book.jpg")
</template>

<style lang="stylus">
dialog.live
  top initial
  bottom 18px
  overflow auto
  position absolute
  max-height calc(100vh - 100px)
  .icon.camera
    vertical-align 1px
  section.empty
    border-top 0
    padding-top 4px
  .placeholder
    border-radius var(--small-entity-radius)
    margin-top 10px
  .loader
    height 14px
    width 14px
    vertical-align -3px
    margin-left 3px
  .space-list
    .users
      max-width 56px
      flex-wrap wrap
      justify-content flex-start
    &.multiple-users
      width 100%
</style>
