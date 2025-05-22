<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import Loader from '@/components/Loader.vue'
import SpaceList from '@/components/SpaceList.vue'
import User from '@/components/User.vue'
import utils from '@/utils.js'

import debounce from 'lodash-es/debounce'

const cardStore = useCardStore()
const store = useStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

// let unsubscribes
let unsubscribe

const resultsElement = ref(null)

onMounted(() => {
  updateLinks()
  updateResultsSectionHeight()
  window.addEventListener('resize', updateResultsSectionHeight)
  unsubscribe = store.subscribe((mutation, state) => {
    if (mutation.type === 'currentSpace/restoreSpace' && props.visible) {
      updateLinks()
    }
  })
  // const cardStoreUnsubscribe = cardStore.$onAction(
  //   ({name, args}) => {
  //     if (name === 'moveCards') {
  //       cancelAnimation()
  //     }
  //   }
  // )
  // unsubscribes = () => {
  //   cardStoreUnsubscribe()
  // }
})
onBeforeUnmount(() => {
  // unsubscribes()
  unsubscribe()
})

const props = defineProps({
  visible: Boolean,
  parentIsPinned: Boolean
})
const state = reactive({
  resultsSectionHeight: null,
  links: [],
  loading: false,
  spaces: [],
  prevSpaceId: '',
  currentUserSpacesIsVisibleOnly: false
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateLinks()
    updateResultsSectionHeight()
  }
})
watch(() => state.loading, (value, prevValue) => {
  updateResultsSectionHeight()
})

const shouldShowSpaces = computed(() => {
  const spaces = state.spaces || []
  return !state.loading && spaces.length
})
const filteredSpaces = computed(() => {
  if (state.currentUserSpacesIsVisibleOnly) {
    return state.spaces.filter(space => space.userId === userStore.id)
  } else {
    return state.spaces
  }
})
const userSpacesToggleShouldBeVisible = computed(() => {
  const otherUserSpaces = state.spaces.filter(space => space.userId !== userStore.id) || []
  const isOtherUserSpaces = Boolean(otherUserSpaces.length)
  const shouldForceToggleVisible = !isOtherUserSpaces && state.spaces.length
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
  store.dispatch('currentSpace/changeSpace', space)
  store.dispatch('closeAllDialogs')
}
const updateLinks = async () => {
  const spaceId = store.state.currentSpace.id
  if (state.prevSpaceId === spaceId) { return }
  state.spaces = []
  state.loading = true
  debouncedUpdateLinks()
}
const debouncedUpdateLinks = debounce(async function () {
  const spaceId = store.state.currentSpace.id
  const links = await store.dispatch('api/getCardsWithLinkToSpaceId', spaceId)
  state.loading = false
  state.prevSpaceId = spaceId
  if (!links) { return }
  if (!links.spaces.length) { return }
  if (links.spaces.length) {
    state.spaces = links.spaces
  }
}, 350, { leading: true })
const updateResultsSectionHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = resultsElement.value
  state.resultsSectionHeight = utils.elementHeight(element, true)
}
</script>

<template lang="pug">
.links(v-if="props.visible")
  section
    p Backlinks
    Loader(:visible="state.loading" :isSmall="true")
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
        span when editing a card to create links
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
</style>
