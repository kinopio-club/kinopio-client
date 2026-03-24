<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import Loader from '@/components/Loader.vue'
import SpaceList from '@/components/SpaceList.vue'
import User from '@/components/User.vue'
import utils from '@/utils.js'

import debounce from 'lodash-es/debounce'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

let unsubscribes

const resultsElement = ref(null)

onMounted(() => {
  updateSpaces()
  updateResultsSectionHeight()
  window.addEventListener('resize', updateResultsSectionHeight)

  const spaceActionUnsubscribe = spaceStore.$onAction(
    ({ name, args }) => {
      if (name === 'restoreSpace') {
        updateSpaces()
      }
    }
  )
  unsubscribes = () => {
    spaceActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateResultsSectionHeight)
  unsubscribes()
})

const props = defineProps({
  visible: Boolean,
  parentIsPinned: Boolean
})
const state = reactive({
  resultsSectionHeight: null,
  links: [],
  loading: false,
  incomingSpaces: [],
  outgoingSpaces: [],
  prevSpaceId: '',
  currentUserSpacesIsVisibleOnly: false,
  showIncoming: true
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateSpaces()
    updateResultsSectionHeight()
  }
})
watch(() => state.loading, (value, prevValue) => {
  updateResultsSectionHeight()
})

const spaces = computed(() => {
  return state.incomingSpaces
})

const shouldShowSpaces = computed(() => {
  const spaces = state.incomingSpaces || []
  return !state.loading && spaces.length
})
const filteredSpaces = computed(() => {
  if (state.currentUserSpacesIsVisibleOnly) {
    return state.incomingSpaces.filter(space => space.userId === userStore.id)
  } else {
    return state.incomingSpaces
  }
})
const userSpacesToggleShouldBeVisible = computed(() => {
  const otherUserSpaces = state.incomingSpaces.filter(space => space.userId !== userStore.id) || []
  const isOtherUserSpaces = Boolean(otherUserSpaces.length)
  const shouldForceToggleVisible = !isOtherUserSpaces && state.incomingSpaces.length
  if (isOtherUserSpaces || shouldForceToggleVisible) {
    return true
  } else {
    return false
  }
})
const parentDialog = computed(() => 'links')
const toggleCurrentUserSpacesIsVisibleOnly = () => {
  state.currentUserSpacesIsVisibleOnly = !state.currentUserSpacesIsVisibleOnly
}
const changeSpace = (space) => {
  spaceStore.changeSpace(space)
  globalStore.closeAllDialogs()
}
const updateSpaces = async () => {
  const spaceId = spaceStore.id
  if (state.prevSpaceId === spaceId) { return }
  state.incomingSpaces = []
  state.loading = true
  debouncedUpdateSpaces()
}
const updateOutgoingSpaces = () => {
  console.log('🫐🫐🫐', cardStore.getAllCards) // todo computed getter
}
const debouncedUpdateSpaces = debounce(async function () {
  const spaceId = spaceStore.id
  const links = await apiStore.getCardsWithLinkToSpaceId(spaceId)
  state.loading = false
  state.prevSpaceId = spaceId
  if (!links) { return }
  if (!links.spaces.length) { return }
  if (links.spaces.length) {
    state.incomingSpaces = links.spaces
  }
  updateOutgoingSpaces()
}, 350, { leading: true })
const updateResultsSectionHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = resultsElement.value
  state.resultsSectionHeight = utils.elementHeight(element, true)
}

// incoming, outgoing

const toggleShowIncoming = (value) => {
  state.showIncoming = value
}
</script>

<template lang="pug">
.links(v-if="props.visible")
  section
    .row.title-row
      div
        span Backlinks
        Loader(:visible="state.loading" :isSmall="true")
    .row
      .segmented-buttons
        button(:class="{ active: state.showIncoming }" @click="toggleShowIncoming(true)")
          span Incoming
        button(:class="{ active: !state.showIncoming }" @click="toggleShowIncoming(false)")
          span Outgoing
  section.results-section(v-if="shouldShowSpaces" ref="resultsElement" :style="{'max-height': state.resultsSectionHeight + 'px'}")
    SpaceList(
      :spaces="filteredSpaces"
      :showUser="true"
      @selectSpace="changeSpace"
      :parentIsPinned="props.parentIsPinned"
      :resultsSectionHeight="state.resultsSectionHeight"
      :parentDialog="parentDialog"
      :disableListOptimizations="true"
    )
  section.tips-section(v-else)
    section.subsection
      p Other spaces with cards that link to this space can be found here.
      p Type
        span {{' '}}
        span.badge.info /
        span when editing a card to create links.
</template>

<style lang="stylus">
.links
  border-top 1px solid var(--primary-border)
  .button-wrap
    margin 0
  .tips-section
    border 0
    padding-top 0
  .subsection
    padding 4px
    border-radius var(--entity-radius)
  label
    .user
      vertical-align -3px
      transform translateY(-1px)
      margin-right 0
      .user-avatar
        width 17px
        height 16px
  .loader
    margin-left 5px
    vertical-align -1px
</style>
