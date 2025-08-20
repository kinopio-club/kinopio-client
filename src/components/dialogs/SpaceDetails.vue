<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useGroupStore } from '@/stores/useGroupStore'

import cache from '@/cache.js'
import SpaceDetailsInfo from '@/components/SpaceDetailsInfo.vue'
import SpaceFilters from '@/components/dialogs/SpaceFilters.vue'
import SpaceList from '@/components/SpaceList.vue'
import AddSpaceButton from '@/components/AddSpaceButton.vue'
import utils from '@/utils.js'

import debounce from 'lodash-es/debounce'
import uniqBy from 'lodash-es/uniqBy'
import dayjs from 'dayjs'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()
const groupStore = useGroupStore()

const maxIterations = 30
let currentIteration, updatePositionTimer

const dialogElement = ref(null)
const resultsElement = ref(null)
let unsubscribes

onMounted(() => {
  window.addEventListener('resize', updateHeights)

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      // on resultsFilter addSpace
      if (name === 'triggerSpaceDetailsUpdateLocalSpaces') {
        updateLocalSpaces()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateHeights)
  unsubscribes()
})

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  globalStore.clearNotificationsWithPosition()
  if (value) {
    globalStore.shouldExplicitlyHideFooter = true
    init()
  } else {
    globalStore.shouldExplicitlyHideFooter = false
  }
})

const state = reactive({
  spaces: [],
  isLoadingRemoteSpaces: false,
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
  spaceStore.updateSpacePreviewImage()
}

// current space

const isLoadingSpace = computed(() => globalStore.isLoadingSpace)
const currentSpaceIsHidden = computed(() => spaceStore.getSpaceIsHidden)
const spaceName = computed(() => spaceStore.name)

// dialog

const spaceDetailsIsPinned = computed(() => globalStore.spaceDetailsIsPinned)
const style = computed(() => {
  return { maxHeight: state.dialogHeight + 'px' }
})
const backButtonIsVisible = computed(() => {
  const spaceId = globalStore.prevSpaceIdInSession
  return spaceId && spaceId !== spaceStore.id
})
const closeDialogs = () => {
  state.spaceFiltersIsVisible = false
  globalStore.triggerCloseChildDialogs()
}
const showTemplatesDialog = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerTemplatesIsVisible()
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
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const updateResultsSectionHeight = async () => {
  await nextTick()
  const element = resultsElement.value
  state.resultsSectionHeight = utils.elementHeight(element) - 2
}

// filters

const dialogSpaceFilterSortBy = computed(() => userStore.dialogSpaceFilterSortBy)
const dialogSpaceFilterByUser = computed(() => userStore.dialogSpaceFilterByUser)
const dialogSpaceFilterShowHidden = computed(() => userStore.dialogSpaceFilterShowHidden)
const dialogSpaceFilterByGroup = computed(() => userStore.dialogSpaceFilterByGroup)
const dialogSpaceFilterByTemplates = computed(() => userStore.dialogSpaceFilterByTemplates)

const spaceFiltersIsActive = computed(() => {
  return Boolean(
    dialogSpaceFilterShowHidden.value ||
    utils.objectHasKeys(dialogSpaceFilterByUser.value) ||
    dialogSpaceFilterSortByIsActive.value ||
    utils.objectHasKeys(dialogSpaceFilterByGroup.value) ||
    dialogSpaceFilterByTemplates.value
  )
})
const filteredSpaces = computed(() => {
  let spaces = state.spaces
  spaces = spaces.filter(space => space.id)
  // hide by hidden spaces unless filter active
  if (!dialogSpaceFilterShowHidden.value) {
    spaces = spaces.filter(space => {
      const isHidden = spaceStore.getSpaceIsHiddenById(space.id)
      return !isHidden
    })
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
  const privacy = spaceStore.privacy
  if (privacy === 'private') { return false }
  return spaceStore.showInExplore
})
const isSpaceMember = computed(() => {
  return userStore.getUserIsSpaceMember
})
const removeLabel = computed(() => {
  const isSpaceCollaborator = userStore.getUserIsSpaceCollaborator
  if (isSpaceCollaborator) {
    return 'Leave'
  } else {
    return 'Remove'
  }
})
const clearAllFilters = () => {
  closeDialogs()
  globalStore.triggerClearAllSpaceFilters()
}
const toggleSpaceFiltersIsVisible = () => {
  const isVisible = state.spaceFiltersIsVisible
  closeDialogs()
  state.spaceFiltersIsVisible = !isVisible
}

// sort by groups

const spaceGroupsByAlphabetical = (spaces) => {
  const groups = groupStore.getAllGroups
  const spaceGroups = []
  spaces.forEach(space => {
    if (!space.groupId) { return }
    const isPrevGroup = spaceGroups.find(spaceGroup => spaceGroup.id === space.groupId)
    if (isPrevGroup) { return }
    const group = groups.find(group => group.id === space.groupId)
    spaceGroups.push(group)
  })
  return utils.sortByAlphabetical(spaceGroups, 'name')
}
const sortByGroups = (spaces, groups) => {
  const spacesWithGroups = groups.flatMap(group =>
    spaces.filter(space => space.groupId === group.id)
  )
  const spacesWithoutGroups = spaces.filter(space => !space.groupId)
  return [...spacesWithGroups, ...spacesWithoutGroups]
}

// sort

const dialogSpaceFilterSortByIsActive = computed(() => {
  return shouldSortByCreatedAt.value || shouldSortByAlphabetical.value || shouldSortByGroups.value
})
const shouldSortByCreatedAt = computed(() => {
  const value = dialogSpaceFilterSortBy.value
  return value === 'createdAt'
})
const shouldSortByAlphabetical = computed(() => {
  const value = dialogSpaceFilterSortBy.value
  return value === 'alphabetical'
})
const shouldSortByGroups = computed(() => {
  const value = dialogSpaceFilterSortBy.value
  return value === 'groups'
})
const prependFavoriteSpaces = (spaces) => {
  const favoriteSpaces = []
  const otherSpaces = []
  spaces.forEach(space => {
    const isFavorite = spaceStore.getSpaceIsFavorite(space.id)
    if (isFavorite) {
      favoriteSpaces.push(space)
    } else {
      otherSpaces.push(space)
    }
  })
  return favoriteSpaces.concat(otherSpaces)
}
const prependInboxSpaces = (spaces) => {
  const inboxSpaces = []
  const otherSpaces = []
  spaces.forEach(space => {
    const isInbox = space.name === 'Inbox'
    if (isInbox) {
      inboxSpaces.push(space)
    } else {
      otherSpaces.push(space)
    }
  })
  return inboxSpaces.concat(otherSpaces)
}
const sort = (spaces) => {
  if (shouldSortByCreatedAt.value) {
    spaces = utils.sortByCreatedAt(spaces)
  } else if (shouldSortByAlphabetical.value) {
    spaces = utils.sortByAlphabetical(spaces, 'name')
  } else if (shouldSortByGroups.value) {
    const groups = spaceGroupsByAlphabetical(spaces)
    spaces = utils.sortByAlphabetical(spaces, 'name')
    spaces = sortByGroups(spaces, groups)
  } else {
    spaces = utils.sortByUpdatedAt(spaces)
  }
  spaces = prependFavoriteSpaces(spaces)
  spaces = prependInboxSpaces(spaces)
  return spaces
}

// add space

const addSpace = async () => {
  window.scrollTo(0, 0)
  await spaceStore.createSpace()
  updateLocalSpaces()
  globalStore.triggerFocusSpaceDetailsName()
}

// select space

const changeSpace = (space) => {
  spaceStore.changeSpace(space)
  globalStore.closeAllDialogs()
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
  cacheSpaces = utils.addCurrentUserIsCollaboratorToSpaces(cacheSpaces, userStore.getUserAllState)
  state.spaces = cacheSpaces
}
const updateWithRemoteSpaces = async () => {
  const currentUserIsSignedIn = userStore.getUserIsSignedIn
  const isOffline = computed(() => !globalStore.isOnline)
  if (!currentUserIsSignedIn || isOffline.value) { return }
  try {
    state.isLoadingRemoteSpaces = true
    const [userSpaces, groupSpaces] = await Promise.all([
      apiStore.getUserSpaces(),
      apiStore.getUserGroupSpaces()
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
    for (const remoteSpace of remoteSpaces) {
      const isCached = cacheSpaceIds.includes(remoteSpace.id)
      // update spaces with remote metadata
      if (isCached) {
        cacheSpaceIds = cacheSpaceIds.filter(id => id !== remoteSpace.id)
        const updates = {}
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
    for (const cacheSpaceId of cacheSpaceIds) {
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
        AddSpaceButton(:parentIsInDialog="true" @closeDialogs="closeDialogs" @addSpace="addSpace" :isSmall="true")
        //- Templates
        button.small-button(@click="showTemplatesDialog")
          img.icon.templates(src="@/assets/templates.svg")
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
    left -40px
    top -36px
  .space-list
    .inline-favorite-wrap
      padding-top 4px

</style>
