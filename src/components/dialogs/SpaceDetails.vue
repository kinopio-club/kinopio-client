<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import cache from '@/cache.js'
import SpaceDetailsInfo from '@/components/SpaceDetailsInfo.vue'
import SpaceFilters from '@/components/dialogs/SpaceFilters.vue'
import SpaceList from '@/components/SpaceList.vue'
import AddSpaceButtons from '@/components/AddSpaceButtons.vue'
import utils from '@/utils.js'

import debounce from 'lodash-es/debounce'
import uniqBy from 'lodash-es/uniqBy'
import dayjs from 'dayjs'

const store = useStore()

const maxIterations = 30
let currentIteration, updatePositionTimer

const dialogElement = ref(null)
const resultsElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateHeights)
  store.subscribe(mutation => {
    // on resultsFilter addSpace
    if (mutation.type === 'triggerSpaceDetailsUpdateLocalSpaces') {
      updateLocalSpaces()
    }
  })
})

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  store.commit('clearNotificationsWithPosition')
  if (value) {
    store.commit('shouldExplicitlyHideFooter', true)
    init()
  } else {
    store.commit('shouldExplicitlyHideFooter', false)
  }
})

const state = reactive({
  spaces: [],
  favoriteSpaces: [],
  isLoadingRemoteSpaces: false,
  remoteSpaces: [],
  resultsSectionHeight: null,
  dialogHeight: null,
  spaceFiltersIsVisible: false,
  parentDialog: 'spaceDetails'
})

const init = async () => {
  closeDialogs()
  if (!state.spaces.length) {
    updateLocalSpaces()
    updateHeights()
  }
  await updateWithRemoteSpaces()
  updateHeights()
  store.dispatch('currentSpace/createSpacePreviewImage')
}

// current space

const isLoadingSpace = computed(() => store.state.isLoadingSpace)
const currentSpaceIsHidden = computed(() => store.state.currentSpace.isHidden)
const spaceName = computed(() => store.state.currentSpace.name)

// dialog

const spaceDetailsIsPinned = computed(() => store.state.spaceDetailsIsPinned)
const style = computed(() => {
  return { maxHeight: state.dialogHeight + 'px' }
})
const backButtonIsVisible = computed(() => {
  const spaceId = store.state.prevSpaceIdInSession
  return spaceId && spaceId !== store.state.currentSpace.id
})
const closeDialogs = () => {
  state.spaceFiltersIsVisible = false
  store.commit('triggerCloseChildDialogs')
}

// dialog heights

const updateHeights = () => {
  if (!props.visible) {
    window.cancelAnimationFrame(updatePositionTimer)
    updatePositionTimer = undefined
    return
  }
  currentIteration = 0
  if (updatePositionTimer) { return }
  updatePositionTimer = window.requestAnimationFrame(updateHeightsFrame)
}
const updateHeightsFrame = () => {
  currentIteration++
  updateDialogHeight()
  updateResultsSectionHeight()
  if (currentIteration < maxIterations) {
    window.requestAnimationFrame(updateHeightsFrame)
  } else {
    window.cancelAnimationFrame(updatePositionTimer)
    updatePositionTimer = undefined
  }
}
const updateDialogHeight = async () => {
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const updateResultsSectionHeight = async () => {
  await nextTick()
  let element = resultsElement.value
  state.resultsSectionHeight = utils.elementHeight(element) - 2
}

// filters

const dialogSpaceFilterSortBy = computed(() => store.state.currentUser.dialogSpaceFilterSortBy)
const dialogSpaceFilterByUser = computed(() => store.state.currentUser.dialogSpaceFilterByUser)
const dialogSpaceFilterShowHidden = computed(() => store.state.currentUser.dialogSpaceFilterShowHidden)
const dialogSpaceFilterByGroup = computed(() => store.state.currentUser.dialogSpaceFilterByGroup)
const dialogSpaceFilterByTemplates = computed(() => store.state.currentUser.dialogSpaceFilterByTemplates)

const spaceFiltersIsActive = computed(() => {
  return Boolean(dialogSpaceFilterShowHidden.value || utils.objectHasKeys(dialogSpaceFilterByUser.value) || dialogSpaceFilterSortByIsActive.value) || utils.objectHasKeys(dialogSpaceFilterByGroup.value)
})
const filteredSpaces = computed(() => {
  let spaces = state.spaces
  spaces = spaces.filter(space => space.id)
  // hide by hidden spaces unless filter active
  if (!dialogSpaceFilterShowHidden.value) {
    spaces = spaces.filter(space => !space.isHidden)
  }
  // filter by user
  if (utils.objectHasKeys(dialogSpaceFilterByGroup.value)) {
    spaces = spaces.filter(space => space.groupId === dialogSpaceFilterByGroup.value.id)
  }
  // filter by user
  if (utils.objectHasKeys(dialogSpaceFilterByUser.value)) {
    spaces = spaces.filter(space => space.userId === dialogSpaceFilterByUser.value.id)
  }
  // filter by templates
  if (dialogSpaceFilterByTemplates.value) {
    spaces = spaces.filter(space => space.isTemplate)
  }
  // sort
  spaces = sort(spaces)
  return spaces
})
const shouldShowInExplore = computed(() => {
  const privacy = store.state.currentSpace.privacy
  if (privacy === 'private') { return false }
  return store.state.currentSpace.showInExplore
})
const isSpaceMember = computed(() => {
  return store.getters['currentUser/isSpaceMember'](store.state.currentSpace)
})
const removeLabel = computed(() => {
  const currentUserIsSpaceCollaborator = store.getters['currentUser/isSpaceCollaborator']()
  if (currentUserIsSpaceCollaborator) {
    return 'Leave'
  } else {
    return 'Remove'
  }
})
const clearAllFilters = () => {
  closeDialogs()
  store.commit('triggerClearAllSpaceFilters')
}
const toggleSpaceFiltersIsVisible = () => {
  const isVisible = state.spaceFiltersIsVisible
  closeDialogs()
  state.spaceFiltersIsVisible = !isVisible
}

// sort

const dialogSpaceFilterSortByIsActive = computed(() => {
  return shouldSortByCreatedAt.value || shouldSortByAlphabetical.value
})
const shouldSortByCreatedAt = computed(() => {
  const value = dialogSpaceFilterSortBy.value
  return value === 'createdAt'
})
const shouldSortByAlphabetical = computed(() => {
  const value = dialogSpaceFilterSortBy.value
  return value === 'alphabetical'
})
const prependFavoriteSpaces = (spaces) => {
  let favoriteSpaces = []
  spaces = spaces.filter(space => {
    if (space.isFavorite) {
      favoriteSpaces.push(space)
    } else {
      return space
    }
  })
  return favoriteSpaces.concat(spaces)
}
const prependInboxSpace = (spaces) => {
  const inboxSpaces = spaces.filter(space => space.name === 'Inbox')
  if (!inboxSpaces.length) { return spaces }
  spaces = spaces.filter(space => space.name !== 'Inbox')
  spaces = inboxSpaces.concat(spaces)
  return spaces
}
const sort = (spaces) => {
  if (shouldSortByCreatedAt.value) {
    spaces = utils.sortByCreatedAt(spaces)
  } else if (shouldSortByAlphabetical.value) {
    spaces = utils.sortByAlphabetical(spaces, 'name')(spaces)
  } else {
    spaces = utils.sortByUpdatedAt(spaces)
  }
  spaces = prependFavoriteSpaces(spaces)
  spaces = prependInboxSpace(spaces)
  return spaces
}

// add space

const addSpace = async () => {
  window.scrollTo(0, 0)
  await store.dispatch('currentSpace/addSpace')
  updateLocalSpaces()
  store.commit('triggerFocusSpaceDetailsName')
}

// select space

const changeSpace = (space) => {
  store.dispatch('currentSpace/changeSpace', space)
  store.dispatch('closeAllDialogs')
  closeDialogs()
}

// remove space

const removeSpaceFromSpaces = (spaceId) => {
  state.spaces = state.spaces.filter(space => space.id !== spaceId)
}

// update space list

const updateLocalSpaces = async () => {
  if (!props.visible) { return }
  let cacheSpaces = await cache.getAllSpaces()
  cacheSpaces = utils.addCurrentUserIsCollaboratorToSpaces(cacheSpaces, store.state.currentUser)
  state.spaces = cacheSpaces
}
const updateWithRemoteSpaces = async () => {
  const currentUserIsSignedIn = store.getters['currentUser/isSignedIn']
  const isOffline = computed(() => !store.state.isOnline)
  if (!currentUserIsSignedIn || isOffline.value) { return }
  try {
    state.isLoadingRemoteSpaces = true
    const [userSpaces, groupSpaces] = await Promise.all([
      store.dispatch('api/getUserSpaces'),
      store.dispatch('api/getUserGroupSpaces')
    ])
    let spaces = userSpaces || []
    if (groupSpaces) {
      spaces = spaces.concat(groupSpaces)
    }
    spaces = spaces.filter(space => Boolean(space))
    spaces = uniqBy(spaces, 'id')
    state.spaces = spaces
    await updateCachedSpacesWithRemoteSpaces(spaces)
  } catch (error) {
    console.error('🚒 updateWithRemoteSpaces', error)
  }
  state.isLoadingRemoteSpaces = false
}
const updateCachedSpacesWithRemoteSpaces = async (remoteSpaces) => {
  try {
    if (!remoteSpaces.length) { throw Error }
    const cacheSpaces = await cache.getAllSpaces()
    let cacheSpaceIds = cacheSpaces.map(space => space.id)
    for (let remoteSpace of remoteSpaces) {
      const isCached = cacheSpaceIds.includes(remoteSpace.id)
      // update spaces with remote metadata
      if (isCached) {
        cacheSpaceIds = cacheSpaceIds.filter(id => id !== remoteSpace.id)
        let updates = {}
        const metaKeys = ['name', 'privacy', 'isHidden', 'updatedAt', 'editedAt', 'isRemoved', 'groupId', 'showInExplore', 'updateHash', 'isTemplate', 'previewImage', 'previewThumbnailImage', 'isFavorite']
        metaKeys.forEach(key => {
          updates[key] = remoteSpace[key]
        })
        await cache.updateSpaceByUpdates(updates, remoteSpace.id)
      // cache new space
      } else {
        await cache.saveSpace(remoteSpace)
      }
    }
    // update removed spaces
    for (let cacheSpaceId of cacheSpaceIds) {
      await cache.removeSpace({ id: cacheSpaceId })
    }
  } catch (error) {
    console.error('🚒 updateCachedSpacesWithRemoteSpaces', error)
  }
}
</script>

<template lang="pug">
dialog.space-details.is-pinnable.wide(v-if="props.visible" :open="props.visible" @click.left="closeDialogs" ref="dialogElement" :style="style" :data-is-pinned="spaceDetailsIsPinned" :class="{'is-pinned': spaceDetailsIsPinned, 'back-button-is-visible': backButtonIsVisible}")
  section
    SpaceDetailsInfo(@updateLocalSpaces="updateLocalSpaces" @removeSpaceId="removeSpaceFromSpaces" @closeDialogs="closeDialogs" @updateDialogHeight="updateHeights" :currentSpaceIsHidden="currentSpaceIsHidden" @addSpace="addSpace")
  section.results-actions
    .row.title-row
      div
        //- New Space
        AddSpaceButtons(:parentIsInDialog="true" @closeDialogs="closeDialogs" @addSpace="addSpace")
      //- Filters
      .button-wrap
        // no filters
        template(v-if="!spaceFiltersIsActive")
          .button-wrap.title-row-small-button-wrap.section-top(@click.left.stop="toggleSpaceFiltersIsVisible")
            button.small-button(:class="{ active: state.spaceFiltersIsVisible }")
              img.icon(src="@/assets/filter.svg")
        // filters active
        template(v-if="spaceFiltersIsActive")
          .segmented-buttons.title-row-small-button-wrap.section-top
            button.small-button(@click.left.stop="toggleSpaceFiltersIsVisible" :class="{ active: state.spaceFiltersIsVisible || spaceFiltersIsActive }")
              img.icon(src="@/assets/filter.svg")
              .badge.info.filter-is-active
            button.small-button(@click.left.stop="clearAllFilters")
              img.icon.cancel(src="@/assets/add.svg")
        SpaceFilters(:visible="state.spaceFiltersIsVisible" :spaces="filteredSpaces" :isLoading="state.isLoadingRemoteSpaces")

  section.results-section(ref="resultsElement" :style="{'max-height': state.resultsSectionHeight + 'px'}")
    SpaceList(
      :spaces="filteredSpaces"
      :isLoading="state.isLoadingRemoteSpaces"
      :showUserIfCurrentUserIsCollaborator="true"
      :parentIsSpaceDetails="true"
      :showCreateNewSpaceFromSearch="true"
      @selectSpace="changeSpace"
      @addSpace="addSpace"
      :resultsSectionHeight="state.resultsSectionHeight"
      :parentDialog="state.parentDialog"
      :showSpaceGroups="true"
      :showFilter="true"
    )
</template>

<style lang="stylus">
dialog.space-details
  &.back-button-is-visible
    left -18px
  button.disabled
    opacity 0.5
    pointer-events none
  .filter-is-active
    margin 0
    min-height initial
    min-width initial
    display inline-block
    width 10px
    height 10px
    padding 0
    border-radius 100px
    margin-left 3px
  &.is-pinned
    left -45px
    top -13px
  .space-list
    .inline-favorite-wrap
      padding-top 4px

</style>
