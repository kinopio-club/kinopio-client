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

let shouldUpdateFavorites = true
const maxIterations = 30
let currentIteration, updatePositionTimer

const dialogElement = ref(null)
const resultsElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateHeights)
  store.subscribe(mutation => {
    if (mutation.type === 'triggerSpaceDetailsUpdateLocalSpaces') {
      updateLocalSpaces()
    } else if (mutation.type === 'currentUser/favoriteSpaces') {
      if (!props.visible) { return }
      updateLocalSpaces()
    } else if (mutation.type === 'isLoadingSpace') {
      const isLoading = mutation.payload
      if (!props.visible) { return }
      if (isLoading) { return }
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
  updateLocalSpaces()
  await updateWithRemoteSpaces()
  await updateCachedSpaces()
  closeDialogs()
  updateFavorites()
  updateHeights()
  store.commit('shouldExplicitlyHideFooter', true)
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
const updateHeights = () => {
  if (!props.visible) {
    window.cancelAnimationFrame(updatePositionTimer)
    updatePositionTimer = undefined
    return
  }
  currentIteration = 0
  if (updatePositionTimer) { return }
  updatePositionTimer = window.requestAnimationFrame(updatePositionFrame)
}
const updatePositionFrame = () => {
  currentIteration++
  updateDialogHeight()
  updateResultsSectionHeight()
  if (currentIteration < maxIterations) {
    window.requestAnimationFrame(updatePositionFrame)
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
  return isSortByCreatedAt.value || isSortByAlphabetical.value
})
const isSortByCreatedAt = computed(() => {
  const value = dialogSpaceFilterSortBy.value
  return value === 'createdAt'
})
const isSortByAlphabetical = computed(() => {
  const value = dialogSpaceFilterSortBy.value
  return value === 'alphabetical'
})
const prependFavoriteSpaces = (spaces) => {
  let favoriteSpaces = []
  const userFavoriteSpaces = store.state.currentUser.favoriteSpaces || []
  const favoriteSpaceIds = userFavoriteSpaces.map(space => space.id)
  spaces = spaces.map(space => {
    if (favoriteSpaceIds.includes(space.id)) {
      space.isFavorite = true
    }
    return space
  })
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
const sortByCreatedAt = (spaces) => {
  const sortedSpaces = spaces.sort((a, b) => {
    const bCreatedAt = dayjs(b.createdAt).unix()
    const aCreatedAt = dayjs(a.createdAt).unix()
    return bCreatedAt - aCreatedAt
  })
  return sortedSpaces
}
const sortByUpdatedAt = (spaces) => {
  spaces = spaces.map(space => {
    space.editedAt = space.editedAt || space.createdAt
    return space
  })
  const sortedSpaces = spaces.sort((a, b) => {
    const bEditedAt = dayjs(b.editedAt).unix()
    const aEditedAt = dayjs(a.editedAt).unix()
    return bEditedAt - aEditedAt
  })
  return sortedSpaces
}
const sortByAlphabetical = (spaces) => {
  return utils.sortItemsAlphabeticallyBy(spaces, 'name')
}
const sort = (spaces) => {
  if (isSortByCreatedAt.value) {
    spaces = sortByCreatedAt(spaces)
  } else if (isSortByAlphabetical.value) {
    spaces = sortByAlphabetical(spaces)
  } else {
    spaces = sortByUpdatedAt(spaces)
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

const updateLocalSpaces = () => {
  if (!props.visible) { return }
  debouncedUpdateLocalSpaces()
}
const debouncedUpdateLocalSpaces = debounce(async () => {
  await nextTick()
  let cacheSpaces = await cache.getAllSpaces()
  cacheSpaces = cacheSpaces.filter(space => {
    return store.getters['currentUser/canEditSpace'](space)
  })
  state.spaces = utils.addCurrentUserIsCollaboratorToSpaces(cacheSpaces, store.state.currentUser)
}, 350, { leading: true })

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
    state.isLoadingRemoteSpaces = false
  } catch (error) {
    console.error('🚒 updateWithRemoteSpaces', error)
  }
  state.isLoadingRemoteSpaces = false
}
const updateCachedSpaces = async () => {
  if (!state.spaces) { return }
  const cacheSpaces = await cache.getAllSpaces()
  const cacheSpaceIds = cacheSpaces.map(space => space.id)
  for (let space of state.spaces) {
    const isCacheSpace = cacheSpaceIds.includes(space.id)
    if (isCacheSpace) {
      const cacheSpace = await cache.space(space.id)
      const isUpdated = dayjs(space.updatedAt).valueOf() > dayjs(cacheSpace.updatedAt).valueOf()
      if (!isUpdated) { continue }
      space.cards = cacheSpace.cards
      space.boxes = cacheSpace.boxes
      space.connections = cacheSpace.connections
      space.connectionTypes = cacheSpace.connectionTypes
      await cache.saveSpace(space)
    } else {
      await cache.saveSpace(space)
    }
  }
}
const updateFavorites = async () => {
  if (!shouldUpdateFavorites) { return }
  shouldUpdateFavorites = false
  await store.dispatch('currentUser/restoreUserFavorites')
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
